# CLASSIFY_CRYPTO.PY FIXES - December 9, 2025

## Problem Identified
Both binary files were giving the same output because:

1. **Low scoring thresholds** - Script gave points too easily (e.g., 30 points for just having crypto loops)
2. **Generic fallback logic** - Feistel was assigned to anything that wasn't clearly ARX or SPN
3. **No per-binary state reset** - Globals weren't reset between analyses
4. **Insufficient operation counts** - Thresholds too low (e.g., 10 S-box lookups is too few)
5. **Poor evidence tracking** - Didn't show why classifications were made

## Changes Made

### 1. Stricter Scoring Thresholds
**Before:**
- ARX needed 40% operation density → gave 50 points
- SPN needed 10 S-box lookups → gave 60 points  
- Feistel got 30 points for ANY crypto loops

**After:**
- ARX needs 50% density for 60 points, 30% for 30 points
- SPN needs 50+ lookups for 70 points, 20+ for 40 points, 5+ for 15 points
- Feistel needs XOR-dominant pattern + loops + NOT matching ARX/SPN

### 2. Balanced ARX Detection
**Before:**
- Just checked if ADD, ROT, XOR all > 0

**After:**
- Requires each operation type > 5 occurrences
- Checks for balance (no single type dominates >70%)
- Shows actual counts: ADD=X, ROT=Y, XOR=Z

### 3. Per-Binary State Reset
**Before:**
```python
def run_analysis(binary_path, rootfs_path):
    global classifier, jsonl_logger
    jsonl_logger = JsonlLogger("trace.jsonl")  # Same filename!
```

**After:**
```python
def run_analysis(binary_path, rootfs_path):
    global classifier, jsonl_logger, stats_total_blocks, basic_blocks
    # RESET all state
    stats_total_blocks = 0
    basic_blocks = {}
    classifier = ArchitectureClassifier()  # Fresh instance
    
    # Unique filename per binary
    binary_name = os.path.basename(binary_path).replace('.', '_')
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    trace_filename = f"trace_{binary_name}_{timestamp}.jsonl"
    jsonl_logger = JsonlLogger(trace_filename)
```

### 4. Enhanced Reporting
**Added:**
- Binary name in header
- Operation statistics (total blocks, total ops)
- DEBUG evidence showing all operation counts
- Sorted scores (highest first)
- Visual indicators (*** for winner)
- Confidence levels (HIGH/MEDIUM/LOW)
- Detailed reasons for low confidence

**Output Now Shows:**
```
[*] Operation Statistics:
    Total basic blocks analyzed: 1234
    Total operations logged: 5678
    Total ops: 5678
    ARX_ADD: 234
    ARX_ROT: 123
    ARX_XOR: 345
    SBOX_LOOKUP: 0
    CRYPTO_LOOP: 1
    VECTOR_OP: 0

[✓] Primary Architecture: ARX (Score: 85)
    Confidence: HIGH

[*] Detailed Scores:
  *** ARX: 85
        -> High ARX operation density (62.3%)
        -> Balanced Mix: ADD=234, ROT=123, XOR=345
      Feistel: 0
      SPN: 0
      Sponge: 0
      Lai-Massey: 0
```

### 5. Better Feistel Detection
**Before:**
- Generic fallback for anything not ARX/SPN

**After:**
- Checks for XOR-dominant pattern (XOR > ADD)
- Requires crypto loops present
- Explicitly checks it's NOT better matching ARX/SPN
- Different scores: 45 for XOR-dominant, 20 for generic

### 6. Debug Evidence
Added automatic DEBUG evidence showing raw counts:
```python
self.evidence['DEBUG'] = [
    f"Total ops: {total_ops}",
    f"ARX_ADD: {self.op_counts.get('ARX_ADD', 0)}",
    f"ARX_ROT: {self.op_counts.get('ARX_ROT', 0)}",
    f"ARX_XOR: {self.op_counts.get('ARX_XOR', 0)}",
    f"SBOX_LOOKUP: {sbox_lookups}",
    f"CRYPTO_LOOP: {crypto_loops}",
    f"VECTOR_OP: {vector_ops}"
]
```

## Testing

Run the test script to verify different binaries give different outputs:
```bash
cd /home/prajwal/Documents/vestigo-data/qiling_analysis/tests
./test_classify_multiple.sh
```

Or test individual binaries:
```bash
python3 classify_crypto.py /path/to/binary1
python3 classify_crypto.py /path/to/binary2
```

Each run will create unique trace files:
- `trace_binary1_20251209_123456.jsonl`
- `trace_binary2_20251209_123457.jsonl`

## Expected Behavior Now

### Different Binaries Should Show:
1. **Different operation counts** (ARX_ADD, ARX_ROT, ARX_XOR, etc.)
2. **Different scores** per architecture
3. **Different primary architecture** (or UNKNOWN if no crypto)
4. **Different confidence levels**
5. **Unique trace files** with timestamps

### Similar Binaries Might Show:
- Similar patterns IF they use the same crypto algorithm family
- This is CORRECT behavior - similar code should classify similarly

## Key Takeaway

The script now properly analyzes each binary independently and requires **significant evidence** before making a classification. Low scores (< 30) now correctly report "UNKNOWN" instead of guessing.
