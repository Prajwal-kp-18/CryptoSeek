# Qiling Analysis — Phases and How To Run Them

This document describes the phases used in the `qiling_analysis` pipeline in this repository. It explains what each phase does, where the relevant scripts live, expected outputs, and helpful commands for running and troubleshooting.

## Table of contents
- Overview
- Environment & dependencies
- Phase 0 — Preparation & Unpacking
- Phase 1 — Static Analysis (YARA, constants)
- Phase 2 — Emulation with Qiling
- Phase 3 — Instrumentation & Hooks
- Phase 4 — Basic-block profiling & loop detection
- Phase 5 — Syscall tracing (strace integration)
- Phase 6 — Post-processing & feature extraction
- Phase 7 — Fusion & LLM analysis (RAG / engine)
- Testing & validation
- Troubleshooting and tips


## Overview
The Qiling analysis pipeline is designed to analyze firmware and binaries to detect cryptographic functions and behavior. It combines fast static checks (YARA, constant scanning) with dynamic emulation (Qiling) and native syscall traces (strace), producing structured outputs used for ML and LLM fusion.

Root folders and important scripts:
- `qiling_analysis/` — analysis helpers and test scripts
- `qiling_analysis/tests/` — test harnesses and demonstration scripts
- `verify_crypto.py` — end-to-end analyzer that produces strace + qiling outputs
- `classify_crypto.py` — architecture-style classifier using Qiling hooks
- `tests/llm/engine.py` — LLM fusion engine (uses analysis + strace)
- `strace_logs/` — native strace outputs (created by the pipeline)
- `analysis_logs/` — textual analysis logs for LLM consumption


## Environment & dependencies
Install project-level dependencies (recommended virtualenv):

```bash
python3 -m venv qiling_env
source qiling_env/bin/activate
pip install -r requirements.txt
# Some submodules may have their own requirements: check test folders for further files
```

Key packages used:
- qiling-framework (emulation)
- capstone (disassembly)
- yara-python (YARA scanning)
- chromadb / sentence-transformers / openai (for RAG and LLM fusion)


## Phase 0 — Preparation & Unpacking
Purpose: Prepare the binary, optionally unpack compressed firmware, and produce an executable suitable for Qiling.

Scripts:
- `unpack.py` / `unpacker.py` — attempt to extract embedded files and produce an executable
- `verify_crypto.py` (top-level) — creates a temp copy, optionally unpacks, and prepares environment

Outputs:
- unpacked binary (if unpacked)
- temp working directory under `tests/tmp` or `rootfs/tmp`

Commands:
```bash
python3 qiling_analysis/unpacker.py /path/to/firmware
# or run the main pipeline that calls unpacking automatically
python3 verify_crypto.py /path/to/binary
```

Notes:
- Make sure you have suitable Qiling rootfs for the target architecture.
- `bin/` contains prebuilt qemu helpers used by Qiling in the repo.


## Phase 1 — Static Analysis (YARA, Constants)
Purpose: Fast detection of known crypto constants, signatures, and quick heuristics.

Scripts:
- `yara_scanner.py` — runs YARA rules against the binary
- `constant_scanner.py` — FindCrypt-style constant scanning

Outputs:
- `analysis_logs/<binary>_static.log` (YARA hits, constant lists)
- JSON or CSV records used later by the fusion engine

Commands:
```bash
python3 yara_scanner.py /path/to/binary
python3 constant_scanner.py /path/to/binary
```

Tips:
- YARA rules live in `crypto.yar` or in the `analysis/` folder. Update them as needed.


## Phase 2 — Emulation with Qiling
Purpose: Execute the binary in an emulated environment (Qiling) to capture runtime behavior, basic blocks, function calls, and IO.

Scripts & hooks:
- `verify_crypto.py` — integrates Qiling run and captures emulator output
- `classify_crypto.py` — installs Qiling hooks to profile basic blocks and instruction patterns

Important hooks implemented:
- `hook_block` (basic block profiling)
- `hook_mem_read` / `hook_mem_write` (optional for S-Box detection)
- `hook_syscall` (to track high-level syscalls within emulator)

Outputs:
- JSONL traces `trace_<binary>_<ts>.jsonl` containing block and syscall events
- Raw emulator logs in `qiling_output/` or local temp directories

Commands:
```bash
python3 classify_crypto.py /path/to/binary
# or
python3 verify_crypto.py /path/to/binary
```

Notes:
- Qiling requires a matching rootfs (see `get_rootfs()` helper). If missing, set `ROOTFS` or create a proper Qiling rootfs.
- Emulation may require environment variables or input (some crypto code runs only on specific inputs).


## Phase 3 — Instrumentation & Hooks
Purpose: Add targeted instrumentation to detect S-Boxes, ARX ops, loop patterns, and entropy in-memory.

What to look for:
- Frequent memory reads from small tables (S-Boxes)
- High density of add/rotate/xor instructions (ARX)
- Repeated basic blocks marking loops (crypto rounds)

Where implemented:
- `classify_crypto.py` — collects mnemonics per basic block and tallies op counts
- `crypto_logger.py` — (if present) for structured logging utilities

Outputs:
- Aggregated op counts, loop markers, and hints stored in JSONL or in-memory structures for final scoring


## Phase 4 — Basic-block profiling & loop detection
Purpose: Identify repeated/looped basic blocks which often indicate round functions.

Approach:
- Hook basic block execution counts (e.g., `exec_count >= 3` -> mark as loop)
- Record mnemonics on first execution; detect crypto ops and compute crypto-op ratio.

Where implemented:
- `profile_basic_block()` hook inside `classify_crypto.py` or `verify_crypto.py`

Outputs:
- `trace_<binary>.jsonl` with `basic_block` events that contain address, mnemonics, size and loop flags


## Phase 5 — Syscall tracing (strace integration)
Purpose: Run binaries natively (or capture existing logs) with `strace` to observe system-level behavior (getrandom, read, write, mmap).

Script bits:
- `run_with_strace()` inside `verify_crypto.py` runs `strace` and optionally captures program output to separate file.
- The `strace_logs/` directory stores timestamped logs.

Commands:
```bash
# run strace on a binary (native invocation)
python3 verify_crypto.py /path/to/binary
# Or capture existing strace logs and process them
python3 some_parser.py strace_logs/strace_*.log
```

Use in fusion:
- The LLM fusion `engine.py` uses both the `analysis_log` (static + qiling output) and `strace_log` in a single prompt (dual-file mode).


## Phase 6 — Post-processing & feature extraction
Purpose: Convert raw traces (JSONL, logs) into features used by ML or saved for human analysis.

Common steps:
- Parse JSONL traces and extract counts: crypto-op ratios, loops, entropy, getrandom counts
- Run `json_to_csv.py` / `generate_dataset.py` to produce CSV/feature files
- Aggregate YARA hits and constants into final analysis logs

Outputs:
- `features.csv` / `features_output.csv`
- `ghidra_features_labeled.csv` (if GHIDRA integration used)

Commands:
```bash
python3 json_to_csv.py trace_bhoomi_2025*.jsonl
python3 generate_dataset.py --input features/*.json
```


## Phase 7 — Fusion & LLM analysis (RAG / engine)
Purpose: Combine static analysis, Qiling dynamic traces, and native `strace` logs into a single prompt for an LLM to produce a structured classification.

Files:
- `tests/llm/engine.py` — main fusion engine. Supports dual-file mode: `--input analysis.log --strace strace.log`.
- `rag/` — (optional) RAG system to index strace chunks and retrieve targeted evidence before LLM call.

How it works:
1. Produce cleaned `analysis_log` (static + qiling summaries).
2. Optionally index `strace` into the RAG system and retrieve top-k relevant chunks.
3. Build a prompt that includes both analysis and retrieved strace chunks.
4. Call the OpenAI client and parse JSON output into `final_report.json`.

Commands:
```bash
# Single step dual-file fusion
python3 tests/llm/engine.py --input analysis_logs/analysis_bhoomi.log --strace strace_logs/strace_bhoomi.log --out fusion_report.json

# RAG flow (index then analyze)
cd rag
python3 rag_indexer.py --strace-dir ../qiling_analysis/tests/strace_logs/
python3 rag_analyzer.py --strace ../qiling_analysis/tests/strace_logs/strace_bhoomi.log --output ../qiling_analysis/tests/llm/bhoomi_rag_report.json
```

Notes:
- Ensure `OPENAI_API_KEY` is set in `rag/.env` or exported in your shell.
- If logs are large, sample or truncate strace to fit token limits before sending to LLM.


## Testing & validation
- Unit tests are limited in this repo; run small live analyses on known binaries.
- Compare `trace_*.jsonl` and `fusion_report.json` outputs across known-good samples.
- Use `classify_crypto.py` to confirm architecture-specific signals on synthetic test binaries.


## Troubleshooting and tips
- "Missing OPENAI_API_KEY": set `rag/.env` or export `OPENAI_API_KEY`.
- If Qiling fails to emulate: verify rootfs path returned by `get_rootfs()` matches available `rootfs/`.
- Large strace files exceeding token limits: sample head+tail or chunk via `rag_indexer` with smaller chunk size.
- If a result looks incorrect: examine `trace_*.jsonl` for raw evidence (blocks, syscalls) before blaming the LLM.


## Quick command summary
```bash
# Run end-to-end analysis for a binary (native strace + qiling + fusion)
python3 verify_crypto.py /path/to/binary

# Emulation-only classifier
python3 classify_crypto.py /path/to/binary

# Fusion engine (LLM): single-file
python3 tests/llm/engine.py --input ../analysis_logs/analysis_bhoomi.log --out final_report.json

# Fusion engine (LLM): dual-file
python3 tests/llm/engine.py --input ../analysis_logs/analysis_bhoomi.log --strace ../strace_logs/strace_bhoomi.log --out final_report.json

# RAG indexer (index all logs)
cd rag
python3 rag_indexer.py --strace-dir ../qiling_analysis/tests/strace_logs/

# RAG analyzer
python3 rag_analyzer.py --strace ../qiling_analysis/tests/strace_logs/strace_bhoomi.log --output ../qiling_analysis/tests/llm/bhoomi_rag_report.json
```


## Where to go next
- If you want, I can:
  - Add example `analysis_logs/` generated by `verify_crypto.py` for a sample binary
  - Create small unit tests for hooks and S-Box detection
  - Add a short video/gif showing the pipeline run (requires environment with X)


----
If you want edits, tell me which phase you'd like deeper details for, or ask me to add an example run with outputs from one of your sample binaries.
