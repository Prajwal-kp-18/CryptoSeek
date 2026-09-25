# Cleaned Crypto Dataset Deep-Dive

_Last updated: 2025-12-08_. Data source: `ml/cleaned_crypto_dataset.csv` (75,252 rows / 48 raw columns).

## 1. Class Distribution

| Label | Count | Share |
| --- | ---: | ---: |
| ECC | 8,081 | 10.74% |
| RSA | 8,050 | 10.70% |
| non-crypto | 7,812 | 10.38% |
| DSA | 7,751 | 10.30% |
| AES | 7,324 | 9.73% |
| crypto-unknown | 5,990 | 7.96% |
| DH | 4,870 | 6.47% |
| SHA-256 | 3,373 | 4.48% |
| ChaCha20 | 3,009 | 4.00% |
| DES | 2,962 | 3.94% |
| ARIA | 2,858 | 3.80% |
| SHA-3 | 2,178 | 2.89% |
| Camellia | 2,095 | 2.78% |
| HMAC | 2,052 | 2.73% |
| SHA-512 | 1,479 | 1.97% |
| SHA-1 | 1,418 | 1.88% |
| SEED | 1,216 | 1.62% |
| MD5 | 1,097 | 1.46% |
| CMAC | 1,008 | 1.34% |
| SHA-224 | 629 | 0.84% |

*Observation*: the dataset is roughly balanced, but the `crypto-unknown` bucket is ambiguous and behaves like noise for the classifier.

## 2. Low-Information Features

| Column | Observation |
| --- | --- |
| `rsa_bigint_detected` | 99.82% of rows are `1` → behaves like a constant bias term. |
| `has_aes_rcon`, `has_sha_constants` | Always `0`. |
| `has_aes_sbox` | 97.7% `1`, leaving only ~1.7K negatives. |
| `string_refs_count` | Always `0`. |
| `mem_ops_ratio` | Identical values to `load_store_ratio`. |
| `avg_edge_branch_condition_complexplexity` | Mirrors `branch_condition_complexity` (differs in only 13 rows). |
| `num_loop_edges` | Matches `loop_count` for all but one row. |

Keeping these columns adds noise without providing discriminative power, so the training notebook now drops them up-front.

## 3. Feature Quality Highlights

- Structural metrics (`num_basic_blocks`, `instruction_count`, `unique_ngram_count`, etc.) show wide dynamic ranges and differentiate block ciphers vs public-key implementations.
- Operation ratios (`xor_ratio`, `rotate_ratio`, `multiply_ratio`) are extremely sparse—86%+ of rows have zero XOR ratio and >93% have zero multiply ratio. Models that rely heavily on variance benefit from scaling / robust imputing (already in the pipeline).
- `algorithm` is a textual identifier (e.g., `libcrypto-lib-sha256.o_openssl.o`). Treating it as numeric coerces it to `NaN` and introduces junk features, so it is now classified as metadata and excluded from the feature matrix.

## 4. Recommended Training Actions

1. **Remove `crypto-unknown` samples** during supervised training; they represent "something cryptographic" but can map to any concrete algorithm, depressing accuracy.
2. **Drop or one-hot only meaningful categorical fields** (`architecture`, `compiler`, `optimization`).
3. **Keep a list of removed low-signal columns** (see Section 2) so the preprocessing pipeline stays deterministic.
4. **Monitor per-class recall** after training; the baseline LightGBM run had global accuracy ≈0.44 but some classes (e.g., hash variants) underperformed due to noisy labels.

The updated notebook (`ml/new_model.ipynb`) performs the filtering steps above so retraining starts from the cleanest possible table.
