#!/usr/bin/env python3
"""
Dataset Cleaning Script for Crypto Classification
Fixes class imbalance and removes inconsistent/unreliable data
"""

import pandas as pd
import numpy as np
from pathlib import Path

def analyze_dataset(df):
    """Analyze dataset quality and class distribution"""
    print("="*80)
    print("DATASET ANALYSIS")
    print("="*80)

    print(f"\nTotal samples: {len(df):,}")
    print(f"Total features: {len(df.columns)}")

    # Class distribution
    label_counts = df['label'].value_counts().sort_values(ascending=False)
    print(f"\n📊 Class Distribution:")
    print(f"{'Label':<20} {'Count':>10} {'Percentage':>12} {'Imbalance Ratio':>18}")
    print("-" * 65)

    max_count = label_counts.max()
    for label, count in label_counts.items():
        pct = (count / len(df) * 100)
        ratio = max_count / count
        print(f"{label:<20} {count:>10,} {pct:>11.2f}% {ratio:>17.2f}x")

    return label_counts

def clean_dataset(input_csv, output_csv, min_samples_per_class=500, remove_unknown=True):
    """
    Clean dataset by removing problematic classes

    Parameters:
    -----------
    input_csv : str
        Path to input CSV file
    output_csv : str
        Path to output cleaned CSV file
    min_samples_per_class : int
        Minimum samples required per class (default: 500)
    remove_unknown : bool
        Remove 'crypto-unknown' and similar ambiguous labels
    """

    print("\n" + "="*80)
    print("DATASET CLEANING")
    print("="*80)

    # Load dataset
    print(f"\n📂 Loading: {input_csv}")
    df = pd.read_csv(input_csv)
    initial_count = len(df)
    print(f"✓ Loaded {initial_count:,} samples")

    # Analyze original dataset
    print("\n" + "-"*80)
    print("BEFORE CLEANING:")
    original_distribution = analyze_dataset(df)

    # Step 1: Downsample 'crypto-unknown' (proprietary/unidentified crypto)
    if remove_unknown:
        print(f"\n⚖️  Step 1: Downsampling 'crypto-unknown' (proprietary crypto)...")
        print(f"   Note: Keeping this class as it represents real unidentified crypto")

        if 'crypto-unknown' in df['label'].values:
            crypto_unknown_count = len(df[df['label'] == 'crypto-unknown'])
            other_crypto_avg = df[~df['label'].isin(['crypto-unknown', 'non-crypto'])]['label'].value_counts().mean()

            # Downsample crypto-unknown to 1.5x average crypto class size
            target_unknown = int(other_crypto_avg * 1.5)
            target_unknown = max(target_unknown, 1000)  # Keep at least 1000 samples

            if crypto_unknown_count > target_unknown:
                print(f"   Current crypto-unknown: {crypto_unknown_count:,}")
                print(f"   Target crypto-unknown: {target_unknown:,}")

                unknown_df = df[df['label'] == 'crypto-unknown']
                other_df = df[df['label'] != 'crypto-unknown']

                unknown_sampled = unknown_df.sample(n=target_unknown, random_state=42)
                df = pd.concat([other_df, unknown_sampled], ignore_index=True)

                print(f"   ✓ Downsampled crypto-unknown to {target_unknown:,}")
            else:
                print(f"   ✓ crypto-unknown already balanced ({crypto_unknown_count:,} samples)")
        else:
            print(f"   ⚠ No 'crypto-unknown' class found in dataset")

    # Step 2: Remove classes with too few samples
    print(f"\n🗑️  Step 2: Removing classes with < {min_samples_per_class} samples...")

    label_counts = df['label'].value_counts()
    small_classes = label_counts[label_counts < min_samples_per_class].index.tolist()

    if small_classes:
        print(f"   Classes to remove ({len(small_classes)}):")
        for label in small_classes:
            count = label_counts[label]
            print(f"     - {label}: {count} samples")

        removed_small = df[df['label'].isin(small_classes)]
        df = df[~df['label'].isin(small_classes)]
        print(f"   Removed {len(removed_small):,} samples from small classes")
    else:
        print(f"   ✓ All classes have >= {min_samples_per_class} samples")

    # Step 3: Balance ALL oversized classes (prevent overfitting to ANY class)
    print(f"\n⚖️  Step 3: Balancing oversized classes...")

    label_counts = df['label'].value_counts()
    avg_count = label_counts.mean()
    median_count = label_counts.median()

    print(f"   Average class size: {avg_count:.0f}")
    print(f"   Median class size: {median_count:.0f}")

    # Cap any class that's more than 2.5x the median
    max_allowed = int(median_count * 2.5)
    print(f"   Maximum allowed per class: {max_allowed:,} (2.5x median)")

    oversized_classes = label_counts[label_counts > max_allowed]

    if len(oversized_classes) > 0:
        print(f"\n   Classes to downsample ({len(oversized_classes)}):")

        balanced_dfs = []
        for label in df['label'].unique():
            label_df = df[df['label'] == label]
            current_count = len(label_df)

            if current_count > max_allowed:
                # Downsample this class
                downsampled = label_df.sample(n=max_allowed, random_state=42)
                balanced_dfs.append(downsampled)
                print(f"     - {label}: {current_count:,} → {max_allowed:,}")
            else:
                # Keep as is
                balanced_dfs.append(label_df)

        df = pd.concat(balanced_dfs, ignore_index=True)
        print(f"   ✓ Balanced {len(oversized_classes)} oversized classes")
    else:
        print(f"   ✓ All classes are reasonably balanced")

    # Step 4: Remove duplicate rows
    print(f"\n🔍 Step 4: Removing duplicate rows...")

    # Check for duplicates based on features (excluding filename, function_name, etc.)
    feature_cols = [col for col in df.columns
                   if col not in ['filename', 'function_name', 'function_address', 'algorithm']]

    initial_rows = len(df)
    df = df.drop_duplicates(subset=feature_cols, keep='first')
    duplicates_removed = initial_rows - len(df)

    if duplicates_removed > 0:
        print(f"   Removed {duplicates_removed:,} duplicate rows")
    else:
        print(f"   ✓ No duplicates found")

    # Analyze cleaned dataset
    print("\n" + "-"*80)
    print("AFTER CLEANING:")
    cleaned_distribution = analyze_dataset(df)

    # Summary
    print("\n" + "="*80)
    print("CLEANING SUMMARY")
    print("="*80)
    print(f"Original samples:  {initial_count:>10,}")
    print(f"Cleaned samples:   {len(df):>10,}")
    print(f"Removed samples:   {initial_count - len(df):>10,} ({(initial_count - len(df))/initial_count*100:.1f}%)")
    print(f"\nOriginal classes:  {len(original_distribution):>10}")
    print(f"Cleaned classes:   {len(cleaned_distribution):>10}")
    print(f"Removed classes:   {len(original_distribution) - len(cleaned_distribution):>10}")

    # Calculate new imbalance ratio
    max_count = cleaned_distribution.max()
    min_count = cleaned_distribution.min()
    imbalance_ratio = max_count / min_count

    print(f"\n📊 Class Balance Improvement:")
    print(f"Original max imbalance: {original_distribution.max() / original_distribution.min():.1f}x")
    print(f"Cleaned max imbalance:  {imbalance_ratio:.1f}x")

    # Save cleaned dataset
    print(f"\n💾 Saving cleaned dataset to: {output_csv}")
    df.to_csv(output_csv, index=False)
    print(f"✓ Saved {len(df):,} samples")

    # Create a detailed report
    report_path = output_csv.replace('.csv', '_cleaning_report.txt')
    with open(report_path, 'w') as f:
        f.write("DATASET CLEANING REPORT\n")
        f.write("="*80 + "\n\n")
        f.write(f"Original file: {input_csv}\n")
        f.write(f"Cleaned file: {output_csv}\n\n")
        f.write(f"Original samples: {initial_count:,}\n")
        f.write(f"Cleaned samples:  {len(df):,}\n")
        f.write(f"Removed samples:  {initial_count - len(df):,} ({(initial_count - len(df))/initial_count*100:.1f}%)\n\n")
        f.write(f"Original classes: {len(original_distribution)}\n")
        f.write(f"Cleaned classes:  {len(cleaned_distribution)}\n\n")
        f.write("CLEANED CLASS DISTRIBUTION:\n")
        f.write("-"*80 + "\n")
        f.write(f"{'Label':<20} {'Count':>10} {'Percentage':>12}\n")
        f.write("-"*80 + "\n")
        for label, count in cleaned_distribution.items():
            pct = (count / len(df) * 100)
            f.write(f"{label:<20} {count:>10,} {pct:>11.2f}%\n")

    print(f"✓ Saved report to: {report_path}")

    return df

def main():
    """Main function"""

    # File paths
    input_csv = "filtered_json_features.csv"
    output_csv = "cleaned_crypto_dataset.csv"

    print("\n🧹 CRYPTO DATASET CLEANING TOOL")
    print("="*80)

    # Check if input file exists
    if not Path(input_csv).exists():
        print(f"❌ Error: Input file not found: {input_csv}")
        return

    # Clean dataset
    cleaned_df = clean_dataset(
        input_csv=input_csv,
        output_csv=output_csv,
        min_samples_per_class=500,  # Minimum 500 samples per class
        remove_unknown=True  # Remove 'crypto-unknown'
    )

    print("\n" + "="*80)
    print("✅ DATASET CLEANING COMPLETE!")
    print("="*80)
    print(f"\n📌 Next Steps:")
    print(f"  1. Review the cleaning report: {output_csv.replace('.csv', '_cleaning_report.txt')}")
    print(f"  2. Update your notebook to use: {output_csv}")
    print(f"  3. Re-train the model with cleaned data")
    print(f"\n💡 Expected Improvements:")
    print(f"  • Higher accuracy (cleaner labels)")
    print(f"  • Better recall across all classes (balanced)")
    print(f"  • Higher F1 scores (consistency)")
    print(f"  • Faster training (fewer samples)")

if __name__ == "__main__":
    main()
