#!/usr/bin/env python3
"""
Train the function-level crypto classifier used by scripts/enhanced_crypto_pipeline.py.

Reads ml/crypto_dataset_optimized_raw.csv and writes:
  ml/saved_models/non_crypto_model.pkl           (sklearn Pipeline: one-hot + LightGBM)
  ml/saved_models/non_crypto_model_metadata.pkl  (class names, feature columns, metrics)

Usage:
  python ml/train_enhanced_model.py [--data ml/crypto_dataset_optimized_raw.csv] [--out ml/saved_models]
"""
import argparse
import os
from datetime import datetime

import joblib
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ML_DIR = os.path.dirname(os.path.abspath(__file__))
LABEL_COLUMN = 'label'
CATEGORICAL_FEATURES = ['architecture', 'compiler', 'optimization']


def build_model(numerical_features):
    preprocess = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES),
        ('num', 'passthrough', numerical_features),
    ])
    classifier = LGBMClassifier(
        n_estimators=400,
        learning_rate=0.05,
        num_leaves=63,
        subsample=0.8,
        subsample_freq=1,
        colsample_bytree=0.8,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbose=-1,
    )
    return Pipeline([('preprocess', preprocess), ('classifier', classifier)])


def main():
    parser = argparse.ArgumentParser(description='Train the enhanced crypto pipeline model')
    parser.add_argument('--data', default=os.path.join(ML_DIR, 'crypto_dataset_optimized_raw.csv'))
    parser.add_argument('--out', default=os.path.join(ML_DIR, 'saved_models'))
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    numerical_features = [c for c in df.columns if c not in CATEGORICAL_FEATURES + [LABEL_COLUMN]]
    feature_columns = CATEGORICAL_FEATURES + numerical_features

    X = df[feature_columns].copy()
    X[CATEGORICAL_FEATURES] = X[CATEGORICAL_FEATURES].astype(str)
    X[numerical_features] = X[numerical_features].apply(pd.to_numeric, errors='coerce').fillna(0)
    y = df[LABEL_COLUMN].astype(str)

    print(f"Loaded {len(df)} rows, {len(feature_columns)} features, {y.nunique()} classes")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = build_model(numerical_features)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro')
    print(classification_report(y_test, y_pred, digits=3))
    print(f"Test accuracy: {accuracy:.4f}  macro F1: {macro_f1:.4f}")

    os.makedirs(args.out, exist_ok=True)
    model_path = os.path.join(args.out, 'non_crypto_model.pkl')
    metadata_path = os.path.join(args.out, 'non_crypto_model_metadata.pkl')

    joblib.dump(model, model_path, compress=3)
    joblib.dump({
        'model_name': 'LightGBM (one-hot categorical)',
        'model_accuracy': round(float(accuracy), 4),
        'macro_f1': round(float(macro_f1), 4),
        'class_names': list(model.classes_),
        'feature_columns': feature_columns,
        'categorical_features': CATEGORICAL_FEATURES,
        'numerical_features': numerical_features,
        'training_data': os.path.basename(args.data),
        'trained_at': datetime.now().isoformat(timespec='seconds'),
    }, metadata_path)

    print(f"Saved model to {model_path}")
    print(f"Saved metadata to {metadata_path}")


if __name__ == '__main__':
    main()
