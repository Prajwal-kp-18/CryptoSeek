# Refactored Crypto Analysis System

## Overview

The crypto analysis system has been split into two independent components following the **separation of concerns** principle:

1. **Telemetry Collector** (`verify_crypto_refactored.py`) - Pure data collection
2. **LLM Analyzer** (`analyze_crypto_telemetry.py`) - Interpretation and decision-making

## Architecture

```
┌──────────────────────────────────────┐
│   verify_crypto_refactored.py       │
│   (Telemetry Collector)              │
│                                      │
│   - Runs binary in Qiling           │
│   - Hooks syscalls (getrandom, etc) │
│   - Profiles basic blocks           │
│   - Monitors memory writes          │
│   - Scans for constants (YARA)      │
│   - NO interpretation               │
│   - NO print statements             │
│                                      │
│   Output: Raw JSON telemetry        │
└──────────────┬───────────────────────┘
               │
               │ JSON (stdout)
               │
               ▼
┌──────────────────────────────────────┐
│   analyze_crypto_telemetry.py       │
│   (LLM Decision Layer)               │
│                                      │
│   - Reads JSON telemetry            │
│   - Classifies algorithms           │
│   - Scores evidence                 │
│   - Generates recommendations       │
│   - Makes final verdict             │
│                                      │
│   Output: Analysis report (JSON)    │
└──────────────────────────────────────┘
```

## Key Improvements

### 1. Removed Fragile Logic

**Before:**
- Relied on `nm` to find function symbols (fails on stripped binaries)
- Used hardcoded function name patterns like "aes", "encrypt"
- Injected S-Boxes into memory (unsafe)
- Mixed data collection with interpretation

**After:**
- Uses only YARA + constant scanning (works on stripped binaries)
- Profiles entire `.text` section via basic block hooks
- No memory modification whatsoever
- Pure telemetry collection

### 2. Pure Telemetry Output

**Before:**
```python
print("[*] Detected AES constants!")
print("[!] WARNING: Custom crypto detected")
print("="*70)
```

**After:**
```json
{
  "static_analysis": {
    "constants": {
      "AES": [{"constant": "S-Box", "address": "0x401234"}]
    }
  }
}
```

Single JSON object to stdout - nothing else.

### 3. Raw Data Collection

**Instruction Profiling:**
```json
"instructions": {
  "bitwise": 45,
  "arithmetic": 23,
  "rotate_shift": 12,
  "data_movement": 78,
  "hardware_crypto": 0,
  "other": 34
}
```

No more boolean "is_crypto_op" - instead, **categorized counts**.

**Memory Writes:**
```json
"memory_writes": [
  {
    "address": "0x7fffe000",
    "size": 32,
    "entropy": 7.923,
    "data_sample": "a3f5b2..."
  }
]
```

Raw entropy values - no thresholds applied.

**Syscalls:**
```json
"syscalls": {
  "getrandom": [
    {
      "buffer_address": "0x7fffec00",
      "buffer_size": 8,
      "flags": 0,
      "data_sample": "4a3e...",
      "entropy": 7.85
    }
  ]
}
```

Complete syscall arguments - no filtering.

### 4. LLM-Friendly Analysis

The analyzer script (`analyze_crypto_telemetry.py`) is designed to be:
- **Replaceable**: Swap with GPT-4, Claude, or custom ML model
- **Transparent**: Clear scoring logic with evidence tracking
- **Extensible**: Easy to add new analysis heuristics

## Usage

### Option 1: Pipe directly (Unix pipeline)

```bash
cd qiling_analysis/tests/

# Collect telemetry and analyze in one step
python3 verify_crypto_refactored.py ../../binary.elf | python3 analyze_crypto_telemetry.py
```

### Option 2: Save telemetry for later

```bash
# Collect telemetry
python3 verify_crypto_refactored.py ../../binary.elf > telemetry.json

# Analyze telemetry (can be done multiple times with different analyzers)
python3 analyze_crypto_telemetry.py telemetry.json

# Or use with an LLM API
cat telemetry.json | llm-api analyze-crypto
```

### Option 3: Process multiple binaries

```bash
# Collect telemetry from all binaries
for binary in ../../dataset_binaries/*.elf; do
    python3 verify_crypto_refactored.py "$binary" > "telemetry_$(basename $binary).json"
done

# Batch analyze
for telemetry in telemetry_*.json; do
    python3 analyze_crypto_telemetry.py "$telemetry" > "report_$telemetry"
done
```

## Telemetry Schema

```json
{
  "metadata": {
    "binary_path": "/absolute/path/to/binary.elf",
    "architecture": "arm",
    "timestamp": 1733635200.123,
    "execution_time_seconds": 2.456
  },
  "static_analysis": {
    "yara": {
      "detected": ["AES", "ChaCha20"],
      "matches": [...],
      "scan_time": 0.042
    },
    "constants": {
      "AES": [{
        "constant": "S-Box",
        "address": "0x401234"
      }]
    },
    "file_size": 785456
  },
  "syscalls": {
    "getrandom": [{
      "buffer_address": "0x7fffec00",
      "buffer_size": 32,
      "flags": 0,
      "data_sample": "hex...",
      "entropy": 7.923
    }],
    "read_random": [...],
    "socket": [...],
    "mmap": [...]
  },
  "execution": {
    "success": true,
    "error_message": "",
    "total_blocks": 1234,
    "total_instructions": 56789
  },
  "basic_blocks": [{
    "address": "0x401000",
    "size": 64,
    "execution_count": 10,
    "instructions": {
      "bitwise": 12,
      "arithmetic": 5,
      "rotate_shift": 3,
      "data_movement": 8,
      "hardware_crypto": 0,
      "other": 2
    },
    "total_instructions": 30
  }],
  "memory_writes": [{
    "address": "0x7fffe000",
    "size": 32,
    "entropy": 7.923,
    "data_sample": "hex..."
  }],
  "crypto_regions": [{
    "algorithm": "AES",
    "constant_type": "S-Box",
    "address": "0x401234"
  }]
}
```

## Analysis Report Schema

```json
{
  "metadata": {...},
  "syscall_analysis": {
    "random_generation": {
      "detected": true,
      "sources": ["getrandom", "/dev/urandom"],
      "key_candidates": [{
        "size": 32,
        "entropy": 7.9,
        "classification": {
          "size_bytes": 32,
          "size_bits": 256,
          "likely_algorithms": ["AES-256", "ChaCha20"],
          "ruled_out": []
        }
      }]
    }
  },
  "execution_analysis": {
    "total_blocks": 1234,
    "total_instructions": 56789,
    "instruction_distribution": {
      "bitwise": 1500,
      "arithmetic": 800,
      ...
    },
    "crypto_loops": [{
      "address": "0x401234",
      "executions": 10,
      "crypto_ratio": 0.75,
      "total_instructions": 30
    }],
    "crypto_intensity": 0.15
  },
  "memory_analysis": {
    "high_entropy_writes": [...],
    "low_entropy_writes": [...],
    "medium_entropy_writes": [...]
  },
  "classification": {
    "verdict": "STANDARD: AES",
    "confidence": "HIGH",
    "score": 75,
    "evidence": {
      "standard_algorithms": {
        "AES": [
          "YARA signature match",
          "15 cryptographic constants found"
        ]
      },
      "proprietary_indicators": [
        "10 crypto loops detected"
      ]
    },
    "recommendations": [
      "Binary appears to use AES. Verify implementation correctness."
    ]
  }
}
```

## Advantages

### 1. **Robustness**
- No reliance on symbols (works on stripped binaries)
- No memory injection (safer)
- No mixed concerns (cleaner)

### 2. **Flexibility**
- Replace analyzer with any LLM or ML model
- Process telemetry offline
- Batch analysis of multiple binaries

### 3. **Debuggability**
- Save raw telemetry for inspection
- Reproduce analysis by re-running analyzer
- Compare different analyzer versions

### 4. **Scalability**
- Collector runs once per binary
- Analyzer can be parallelized
- Telemetry can be stored in database

## Migration Guide

If you have scripts using the old `verify_crypto.py`:

### Before:
```bash
python3 verify_crypto.py binary.elf
# Outputs mixed text and verdicts to stdout
```

### After:
```bash
# Collect telemetry
python3 verify_crypto_refactored.py binary.elf > telemetry.json

# Analyze (same output as before, but structured)
python3 analyze_crypto_telemetry.py telemetry.json > report.json

# Or pipe directly
python3 verify_crypto_refactored.py binary.elf | python3 analyze_crypto_telemetry.py > report.json
```

To get human-readable output:
```bash
python3 verify_crypto_refactored.py binary.elf | \
    python3 analyze_crypto_telemetry.py | \
    jq '.classification'
```

## Testing

Test the refactored system:

```bash
cd qiling_analysis/tests/

# Test with a sample binary
python3 verify_crypto_refactored.py ../../test_firmware > test_telemetry.json

# Verify JSON is valid
jq '.' test_telemetry.json

# Analyze the telemetry
python3 analyze_crypto_telemetry.py test_telemetry.json > test_report.json

# View classification
jq '.classification' test_report.json
```

## Future Enhancements

1. **Add more syscall hooks**: `openssl_*`, `crypto_*`, network I/O
2. **Enhanced memory analysis**: Track data flow between writes
3. **Control flow analysis**: Detect encryption/decryption branches
4. **ML-based classifier**: Train model on telemetry dataset
5. **API mode**: HTTP endpoint for remote telemetry submission

## Troubleshooting

**Error: "Could not determine rootfs or architecture"**
```bash
# Check architecture detection
python3 -c "
from verify_crypto_refactored import detect_architecture
print(detect_architecture('binary.elf'))
"
```

**Error: "Binary path invalid"**
```bash
# Use absolute path
python3 verify_crypto_refactored.py $(pwd)/binary.elf
```

**Empty JSON output**
```bash
# Check stderr for errors
python3 verify_crypto_refactored.py binary.elf 2>errors.log
```

---

**Author**: Refactored on Dec 8, 2025  
**Version**: 5.0 (Telemetry Collector + LLM Analyzer)
