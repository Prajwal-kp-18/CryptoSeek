# Original Features Analysis - Crypto Function Detection

## Complete Feature List (Before Removal)

### Metadata Features (Not used for training)
1. **architecture** - Target CPU architecture (x86, ARM, MIPS, etc.)
2. **algorithm** - Ground truth algorithm label
3. **compiler** - Compiler used (gcc, clang, etc.)
4. **optimization** - Optimization level (O0, O1, O2, O3, Os)
5. **filename** - Source binary filename
6. **function_name** - Function name in binary
7. **function_address** - Function start address
8. **label** - Classification label (crypto/non-crypto)

---

## Training Features (47 total, organized by category)

### 🏗️ Graph Structure Features (11 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| num_unconditional_edges | 9.32% | Unconditional jumps/branches | ❌ KEPT |
| strongly_connected_components | 4.26% | Graph connectivity measure | ❌ KEPT |
| num_edges | 1.93% | Total control flow edges | ❌ KEPT |
| num_conditional_edges | 1.46% | Conditional branches | ❌ KEPT |
| num_basic_blocks | 1.42% | Number of basic blocks | ❌ KEPT |
| branch_density | 3.80% | Branches per instruction | ❌ KEPT |
| num_entry_exit_paths | 1.83% | Entry/exit path count | ❌ KEPT |
| cyclomatic_complexity | 1.60% | Code complexity metric | ❌ KEPT |
| cyclomatic_complexity_density | 1.06% | Complexity per instruction | ❌ KEPT |
| loop_count | 1.60% | Number of loops detected | ❌ KEPT |
| loop_depth | 1.63% | Maximum loop nesting | ❌ KEPT |

### 🔢 Instruction & Operand Features (9 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| instruction_count | 2.15% | Total instructions | ❌ KEPT |
| average_block_size | 2.97% | Avg instructions per block | ❌ KEPT |
| immediate_entropy | 3.07% | Entropy of immediate values | ❌ KEPT |
| bitwise_op_density | 2.52% | Bitwise operations ratio | ❌ KEPT |
| bitwise_ops | 2.35% | Count of bitwise ops | ❌ KEPT |
| arithmetic_ops | 1.89% | Count of arithmetic ops | ❌ KEPT |
| crypto_like_ops | **0.00%** | Crypto-like instruction patterns | ✅ **REMOVED** |
| table_lookup_presence | 1.82% | Table lookup detection | ❌ KEPT |
| branch_condition_complexity | 1.85% | Branch condition complexity | ❌ KEPT |

### 📊 Operation Ratios (6 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| xor_ratio | 1.96% | XOR operations ratio | ❌ KEPT |
| add_ratio | 1.11% | ADD operations ratio | ❌ KEPT |
| logical_ratio | 1.50% | Logical operations ratio | ❌ KEPT |
| load_store_ratio | 1.92% | Memory access ratio | ❌ KEPT |
| multiply_ratio | **0.81%** | Multiply operations ratio | ✅ **REMOVED** |
| rotate_ratio | 1.41% | Rotate operations ratio | ❌ KEPT |

### 🔐 Crypto-Specific Features (6 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| has_aes_sbox | 3.43% | AES S-box constants detected | ❌ KEPT |
| crypto_constant_hits | 3.41% | Crypto constant matches | ❌ KEPT |
| has_aes_rcon | N/A | AES round constants | ⚠️ PRE-REMOVED (always 0) |
| has_sha_constants | N/A | SHA constants detected | ⚠️ PRE-REMOVED (always 0) |
| rsa_bigint_detected | N/A | RSA big integer operations | ⚠️ PRE-REMOVED (>99% flagged) |
| table_lookup_presence | 1.82% | Lookup table usage | ❌ KEPT |

### 💾 Memory & References (4 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| rodata_refs_count | 3.50% | Read-only data references | ❌ KEPT |
| stack_frame_size | 1.59% | Stack frame allocation | ❌ KEPT |
| string_refs_count | N/A | String references | ⚠️ PRE-REMOVED (always 0) |
| mem_ops_ratio | N/A | Memory operations ratio | ⚠️ PRE-REMOVED (duplicate) |

### 🧬 Entropy & Pattern Features (5 features)
| Feature | Importance | Description | Removed? |
|---------|-----------|-------------|----------|
| function_byte_entropy | **0.82%** | Shannon entropy of bytes | ✅ **REMOVED** |
| opcode_entropy | **0.63%** | Entropy of opcodes | ✅ **REMOVED** |
| unique_ngram_count | **0.89%** | Unique n-gram patterns | ✅ **REMOVED** |
| immediate_entropy | 3.07% | Entropy of immediates | ❌ KEPT |
| bitwise_op_density | 2.52% | Bitwise operation density | ❌ KEPT |

### ��️ Categorical Features (3 features → 12 after one-hot encoding)
| Feature | Encoded Columns | Top Importance |
|---------|----------------|----------------|
| architecture | 6 (arm32, arm64, avr, mips, riscv, x86) | architecture_avr: 4.03% |
| compiler | 1 (gcc) | compiler_gcc: 1.75% |
| optimization | 5 (O0, O1, O2, O3, Os) | optimization_O1: 2.71% |

---

## Features Removed in Initial Cleaning (Before Training)

These were identified as problematic and removed before the model was trained:

| Feature | Reason for Removal |
|---------|-------------------|
| string_refs_count | Always zero - no signal |
| rsa_bigint_detected | >99% flagged - no discrimination |
| has_aes_rcon | Always zero - no signal |
| has_sha_constants | Always zero - no signal |
| mem_ops_ratio | Duplicate of load_store_ratio |
| avg_edge_branch_condition_complexplexity | Mirrors branch_condition_complexity |
| num_loop_edges | Mirrors loop_count |

---

## Features Removed After Importance Analysis

These were removed after training based on importance < 1%:

### 1. **crypto_like_ops** (0.00% importance)
- **Purpose**: Count of crypto-like instruction patterns
- **Why Low**: May have been poorly defined or redundant with other features
- **Your Concern**: ✅ Valid - this should be revisited

### 2. **opcode_entropy** (0.63% importance)  
- **Purpose**: Shannon entropy of opcode distribution
- **Why Low**: May be too noisy or redundant with function_byte_entropy
- **Your Concern**: ✅ Valid - entropy is important for crypto

### 3. **multiply_ratio** (0.81% importance)
- **Purpose**: Ratio of multiply operations
- **Why Low**: Modern crypto often uses XOR/shift instead of multiply
- **Your Concern**: ✅ Valid - RSA and some algos use multiplication heavily

### 4. **function_byte_entropy** (0.82% importance)
- **Purpose**: Shannon entropy of function bytes
- **Why Low**: May be redundant with opcode_entropy and immediate_entropy
- **Your Concern**: ✅ Valid - crypto has high entropy

### 5. **unique_ngram_count** (0.89% importance)
- **Purpose**: Count of unique instruction n-grams
- **Why Low**: May not capture crypto patterns well enough
- **Your Concern**: ✅ Valid - n-grams can identify crypto patterns

---

## Analysis: Should These Features Be Kept?

### ✅ **Strong Case for Keeping:**

1. **crypto_like_ops** (0.00%)
   - Despite 0% importance, this is likely due to poor implementation
   - Crypto-specific patterns are crucial
   - **Recommendation**: Re-implement with better pattern matching

2. **opcode_entropy** (0.63%)
   - Crypto functions have distinct opcode distributions
   - Low importance may indicate need for better calculation
   - **Recommendation**: Keep and improve calculation

3. **multiply_ratio** (0.81%)
   - Critical for RSA, Diffie-Hellman, ECC
   - Low importance for symmetric crypto only
   - **Recommendation**: Keep for comprehensive detection

### 🤔 **Moderate Case for Keeping:**

4. **function_byte_entropy** (0.82%)
   - Redundant with other entropy measures
   - May provide complementary information
   - **Recommendation**: Keep if computational cost is low

5. **unique_ngram_count** (0.89%)
   - Pattern diversity matters for crypto
   - Implementation may need refinement
   - **Recommendation**: Re-evaluate implementation

---

## Recommendations

### Option 1: Keep All "Removed" Features
Restore all 5 features and retrain. They may become more important with:
- Different model architectures
- Larger datasets
- Better feature engineering

### Option 2: Selective Restoration
Restore only the most critical:
1. ✅ crypto_like_ops (re-implement properly)
2. ✅ multiply_ratio (essential for RSA/ECC)
3. ✅ opcode_entropy (improve calculation)
4. ⚠️ function_byte_entropy (optional)
5. ⚠️ unique_ngram_count (optional)

### Option 3: Keep Current + Monitor
Keep the current cleaned dataset but:
- Track per-algorithm performance
- If RSA/ECC detection is poor, add multiply_ratio back
- If pattern detection is weak, add n-gram features back

---

## Feature Importance Context

**Note**: Feature importance < 1% doesn't mean the feature is useless:
- XGBoost may prefer other correlated features
- Low-importance features can be critical for edge cases
- Ensemble effects: weak features together can be strong
- Algorithm-specific: some features matter only for certain crypto types

**Current Model**: XGBoost with 69K samples
**Features Kept**: 35 (after removal) → 40 (after one-hot encoding)
**Features Removed**: 5 numerical features

---

## Current Feature Set (After Removal)

### Numerical Features (27)
All except the 5 removed ones listed above

### Categorical Features → One-Hot (12)
- architecture_arm32, architecture_arm64, architecture_avr
- architecture_mips, architecture_riscv, architecture_x86
- compiler_gcc
- optimization_O0, optimization_O1, optimization_O2, optimization_O3, optimization_Os

### Boolean Features (1)
- has_aes_sbox

**Total Training Features**: 40 (27 numerical + 12 one-hot + 1 boolean)

---

Generated: December 8, 2025
