# Engine.py - Dual File Fusion Analysis

## Overview
The enhanced `engine.py` now supports analyzing **TWO files in a single LLM call** for comprehensive cryptographic analysis.

## Features
- ✅ Single file analysis (analysis log only)
- ✅ **Dual file fusion** (analysis log + strace log)
- ✅ Cross-reference evidence from both sources
- ✅ Enhanced correlation findings

## Usage

### Single File Mode
Analyze only the primary analysis log:
```bash
python engine.py --input analysis_bhoomi_20251208_230419.log --out report.json
```

### Dual File Fusion Mode (Recommended)
Analyze both analysis log AND strace log together:
```bash
python engine.py \
  --input ../analysis_logs/analysis_bhoomi_20251208_230419.log \
  --strace ../strace_logs/strace_bhoomi_20251208_230419.log \
  --out fusion_report.json
```

### Using Absolute Paths
```bash
python engine.py \
  --input /home/prajwal/Documents/vestigo-data/qiling_analysis/tests/analysis_logs/analysis_bhoomi_20251208_230419.log \
  --strace /home/prajwal/Documents/vestigo-data/qiling_analysis/tests/strace_logs/strace_bhoomi_20251208_230419.log \
  --out /tmp/fusion_report.json
```

## What Gets Analyzed

### File 1: Analysis Log
- ELF metadata
- YARA crypto signatures
- Constant detection (FindCrypt-style)
- Qiling emulation results
- Crypto function detection
- Loop patterns
- Entropy analysis
- Confidence scoring

### File 2: Strace Log (Optional)
- Native syscall traces
- `getrandom()` / `/dev/urandom` calls
- File operations (open, read, write)
- Memory operations (mmap, mprotect)
- Network I/O
- Timing information

## LLM Analysis

When both files are provided, the LLM will:
1. **Cross-reference** static and dynamic evidence
2. **Correlate** YARA hits with actual syscall behavior
3. **Verify** crypto operations via system calls
4. **Detect** key/cert file I/O patterns
5. **Synthesize** findings into comprehensive report

## Output Format

```json
{
  "timestamp": "2025-12-08T23:04:19.123456",
  "source_files": {
    "analysis_log": "path/to/analysis.log",
    "strace_log": "path/to/strace.log"
  },
  "result": {
    "metadata": {},
    "static_analysis": {},
    "dynamic_analysis": {},
    "syscalls": {},
    "warnings": [],
    "errors": [],
    "windows": [],
    "primary_algorithm": "AES128",
    "crypto_family": "SPN",
    "variant": "CTR",
    "mode": "CTR",
    "classification": "STANDARD_CRYPTO",
    "confidence": 0.85,
    "summary": "Detected AES-128 encryption...",
    "correlation_findings": "Strace confirms getrandom() calls matching AES key generation..."
  }
}
```

## Environment Setup

Make sure your OpenAI API key is configured:

```bash
# In .env file:
OPENAI_API_KEY="sk-proj-YOUR_ACTUAL_KEY_HERE"

# Or export directly:
export OPENAI_API_KEY="sk-proj-YOUR_ACTUAL_KEY_HERE"
```

## Cost Considerations

- **Single file**: ~5,000-20,000 tokens (~$0.01-0.10)
- **Dual file**: ~10,000-50,000 tokens (~$0.05-0.50)

Actual cost depends on file sizes and model used (gpt-4o by default).

## Tips

1. **Use dual mode when available** - provides much richer analysis
2. **Check file sizes** - very large strace logs (>1MB) may need truncation
3. **Review output** - LLM provides `correlation_findings` field in dual mode
4. **Iterate** - if confidence is low, try with more detailed input files

## Troubleshooting

**Error: "Missing OPENAI_API_KEY"**
- Set your API key in `.env` file or environment variable

**Error: Token limit exceeded**
- Truncate large strace logs (keep first/last 10,000 lines)
- Use `head -n 5000` and `tail -n 5000` to sample

**Low confidence scores**
- Run verify_crypto.py with longer timeout
- Ensure binary actually executes (not just loaded)
- Try on unstripped binary if available
