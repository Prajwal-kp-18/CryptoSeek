# Model Updates for 171K Dataset

## Summary
Updated [new_model.ipynb](new_model.ipynb) to handle the larger filtered_json_features.csv dataset (171,311 rows) with strong anti-overfitting measures to prevent bias toward majority classes.

---

## Changes Made

### 1. ✅ Updated Data Path (Cell: 4fdc6ac8)
**Before:**
```python
data_path = "combined_harmonized_dataset.csv"  # 10,050 samples
```

**After:**
```python
data_path = "filtered_json_features.csv"  # 171,311 samples
```

---

### 2. ✅ Increased Model Capacity with Anti-Overfitting (Cell: 4050b224)

#### Random Forest & Extra Trees
| Parameter | Old Value | New Value | Purpose |
|-----------|-----------|-----------|---------|
| `n_estimators` | 200 | 500 | More trees for larger dataset |
| `max_depth` | 20 | 30 | Deeper trees for complex patterns |
| `min_samples_split` | 2 | 20 | **Prevent overfitting to small groups** |
| `min_samples_leaf` | 1 | 10 | **Prevent overfitting to small groups** |
| `max_features` | None | 'sqrt' | Reduce correlation between trees |
| `max_samples` | None | 0.8 | Bootstrap sampling - reduce overfitting |
| `class_weight` | 'balanced' | 'balanced' | **Handle class imbalance** ✓ |

#### XGBoost
| Parameter | Old Value | New Value | Purpose |
|-----------|-----------|-----------|---------|
| `n_estimators` | 200 | 500 | More boosting rounds |
| `learning_rate` | 0.1 | 0.05 | **Slower learning = less overfitting** |
| `max_depth` | 8 | 10 | Deeper trees for large dataset |
| `min_child_weight` | 1 | 10 | **CRITICAL: Prevents minority class overfitting** |
| `reg_alpha` | 0 | 0.5 | **L1 regularization - sparsity** |
| `reg_lambda` | 1 | 2.0 | **L2 regularization - smoothness** |

#### LightGBM
| Parameter | Old Value | New Value | Purpose |
|-----------|-----------|-----------|---------|
| `n_estimators` | 200 | 500 | More boosting rounds |
| `learning_rate` | 0.1 | 0.05 | **Slower learning = less overfitting** |
| `max_depth` | 8 | 10 | Deeper trees for large dataset |
| `num_leaves` | 31 | 50 | More complex trees |
| `min_child_samples` | 20 | 30 | **CRITICAL: Prevents minority class overfitting** |
| `min_child_weight` | 0 | 0.01 | Additional regularization |
| `reg_alpha` | 0 | 0.5 | **L1 regularization** |
| `reg_lambda` | 1 | 2.0 | **L2 regularization** |
| `min_split_gain` | 0 | 0.01 | **Minimum gain to split - prevents overfitting** |
| `class_weight` | 'balanced' | 'balanced' | **Handle class imbalance** ✓ |

#### Neural Network (MLP)
| Parameter | Old Value | New Value | Purpose |
|-----------|-----------|-----------|---------|
| `alpha` | 0.0001 | 0.01 | **100x stronger L2 regularization** |
| `early_stopping` | False | True | **Stop when validation performance degrades** |
| `validation_fraction` | 0 | 0.1 | Use 10% for early stopping validation |
| `n_iter_no_change` | 10 | 20 | Patience for early stopping |

---

### 3. ✅ Enhanced Hyperparameter Tuning (Cell: e5f2e0a5)

#### Cross-Validation Improvement
| Aspect | Old Value | New Value |
|--------|-----------|-----------|
| CV Folds | 3-fold | **5-fold** (better generalization) |
| Search Iterations | 15 | **30** (more thorough search) |
| Total Fits | 45 | **150** (30 × 5 = 150) |

#### New Hyperparameter Search Ranges

**Random Forest:**
```python
'min_samples_split': [20, 30, 50],  # Higher = less overfitting
'min_samples_leaf': [10, 15, 20],   # Higher = less overfitting
'max_samples': [0.7, 0.8, 0.9]      # Bootstrap sampling
```

**XGBoost:**
```python
'min_child_weight': [10, 20, 30],   # CRITICAL for minority class protection
'reg_alpha': [0.1, 0.5, 1.0],       # L1 regularization range
'reg_lambda': [1.0, 2.0, 3.0],      # L2 regularization range
'gamma': [0, 0.1, 0.5]              # Minimum loss reduction
```

**LightGBM:**
```python
'min_child_samples': [30, 50, 70],  # CRITICAL for minority class protection
'reg_alpha': [0.1, 0.5, 1.0],       # L1 regularization range
'reg_lambda': [1.0, 2.0, 3.0],      # L2 regularization range
'min_split_gain': [0.01, 0.05, 0.1] # Minimum gain to split
```

---

## Anti-Overfitting Strategy Summary

### 🎯 Key Mechanisms to Prevent Majority Class Bias

1. **Class Weight Balancing** (`class_weight='balanced'`)
   - Automatically adjusts weights inversely proportional to class frequencies
   - Minority classes get higher weights during training

2. **Increased Minimum Sample Requirements**
   - `min_samples_split`: Requires at least 20-50 samples to split a node
   - `min_samples_leaf`: Requires at least 10-20 samples in leaf nodes
   - `min_child_weight`: XGBoost requires sum of weights ≥ 10-30 in child nodes
   - `min_child_samples`: LightGBM requires ≥ 30-70 samples in child nodes
   - **Effect**: Prevents model from creating splits that only benefit majority classes

3. **Regularization (L1/L2)**
   - `reg_alpha` (L1): Pushes feature weights toward zero (sparsity)
   - `reg_lambda` (L2): Penalizes large weights (smoothness)
   - **Effect**: Prevents complex decision boundaries that memorize majority class patterns

4. **Reduced Learning Rate**
   - Old: 0.1 → New: 0.05
   - **Effect**: Slower, more careful learning reduces overfitting to frequent patterns

5. **Bootstrap Sampling**
   - `max_samples=0.8`: Each tree sees only 80% of data
   - `subsample=0.8`: Each boosting iteration uses 80% of data
   - **Effect**: Introduces randomness, reduces overfitting

6. **Early Stopping (Neural Network)**
   - Monitors validation performance
   - Stops training when performance stops improving
   - **Effect**: Prevents memorization of training data

---

## Expected Performance Improvements

### Dataset Size Impact
| Metric | Old (10K samples) | New (171K samples) |
|--------|-------------------|-------------------|
| Training samples | 8,040 | ~137,000 |
| Test samples | 2,010 | ~34,000 |
| Minority class samples | 10-100 | 170-1,700+ |

### Benefits for 171K Dataset
1. **Better Minority Class Performance**: More samples from rare classes = better learning
2. **More Reliable Cross-Validation**: 5-fold CV with 34K samples per fold vs 2K samples
3. **Reduced Overfitting Risk**: Strong regularization prevents memorizing majority patterns
4. **Better Generalization**: Larger validation sets provide better early stopping signals

---

## Training Time Estimates

| Model | Baseline Training | Hyperparameter Tuning |
|-------|-------------------|----------------------|
| Random Forest | 5-10 minutes | 30-60 minutes |
| Extra Trees | 3-7 minutes | 20-40 minutes |
| XGBoost (GPU) | 3-8 minutes | 20-40 minutes |
| XGBoost (CPU) | 15-30 minutes | 2-4 hours |
| LightGBM (GPU) | 2-5 minutes | 15-30 minutes |
| LightGBM (CPU) | 8-15 minutes | 1-2 hours |
| MLP | 10-20 minutes | 1-2 hours |

**Total Expected Time:**
- Baseline evaluation: ~30-60 minutes
- Hyperparameter tuning (with GPU): ~1-2 hours
- Hyperparameter tuning (CPU only): ~4-8 hours

---

## How to Run

1. **Start Training:**
   ```bash
   cd /home/bhoomi/Desktop/compilerRepo/vestigo-data/ml
   jupyter notebook new_model.ipynb
   ```

2. **Run cells in order:**
   - Cell 1: Import libraries ✓
   - Cell 2: Load data (now uses filtered_json_features.csv) ✓
   - Cell 3: Visualize class distribution
   - Cell 4: Preprocess features
   - Cell 5: Create preprocessing pipeline
   - Cell 6: Train baseline models (with anti-overfitting measures)
   - Cell 7: Hyperparameter tuning (5-fold CV, 30 iterations)
   - Cell 8+: Model comparison and saving

3. **Monitor for Class Balance:**
   - Check class distribution in training output
   - Look for balanced recall scores across all classes
   - Per-class metrics should be relatively uniform (no single class dominating)

---

## Verification Checklist

After training, verify these anti-overfitting measures worked:

- [ ] **Class weights are computed and displayed** (should show higher weights for minority classes)
- [ ] **Training/test split maintains class distribution** (check stratification worked)
- [ ] **Per-class recall is relatively balanced** (not just high for majority classes)
- [ ] **No class has 0% or 100% recall** (indicates overfitting or underfitting)
- [ ] **CV scores are consistent across folds** (indicates stable generalization)
- [ ] **Best model uses regularization parameters** (check best_params output)

---

## Key Metrics to Watch

### Good Model (Balanced Performance)
```
Class Distribution:
  SHA-256 (1%): Recall: 85%, Precision: 82%
  AES-128 (15%): Recall: 88%, Precision: 87%
  ECC (40%): Recall: 90%, Precision: 89%

Macro Recall: 0.88  ← Average across all classes
Accuracy: 0.89      ← Overall correctness
```

### Bad Model (Majority Class Bias)
```
Class Distribution:
  SHA-256 (1%): Recall: 5%, Precision: 90%  ← Ignoring minority!
  AES-128 (15%): Recall: 65%, Precision: 70%
  ECC (40%): Recall: 98%, Precision: 95%   ← Only good at majority!

Macro Recall: 0.56  ← Low (many classes missed)
Accuracy: 0.91      ← High but misleading!
```

**Focus on Macro Recall** - this is the average across all classes, giving equal weight to each class regardless of frequency.

---

## Files Updated

1. ✅ **new_model.ipynb** - Main training notebook
   - Cell 4fdc6ac8: Data loading path
   - Cell 4050b224: Baseline model parameters
   - Cell e5f2e0a5: Hyperparameter tuning

2. ✅ **MODEL_UPDATES_FOR_171K_DATASET.md** - This documentation

---

## Questions or Issues?

If you encounter:
- **Memory errors**: Reduce batch size or use fewer CV folds
- **Slow training**: Ensure GPU is enabled for XGBoost/LightGBM
- **Poor minority class performance**: Check class_weight is applied correctly
- **Overfitting symptoms**: Increase regularization parameters further

---

**Last Updated:** 2025-12-08
**Dataset:** filtered_json_features.csv (171,311 rows)
**Status:** ✅ Ready for training
