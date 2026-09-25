#!/usr/bin/env python3
"""
Extract unique Crypto and Non-Crypto function names from ALL Ghidra JSON files.

This script:
  ✔ Recursively scans a directory for ALL *.json files (defaults to ghidra_output/)
  ✔ Extracts function labels ("Crypto" or "Non-Crypto")
  ✔ Creates TWO output files:
        - crypto_functions.txt
        - noncrypto_functions.txt
  ✔ Removes duplicates across ALL binaries and ALL architectures
  ✔ Works with any library (Monocypher, TinyCrypt, mbedTLS, wolfSSL, OpenSSL…)
  ✔ Architecture and compiler agnostic

Usage:
    python3 extract_noncrypto_names.py              # Uses ghidra_output/ by default
    python3 extract_noncrypto_names.py <json_dir>   # Or specify custom directory
"""

import json
import sys
from pathlib import Path

crypto_names = set()
noncrypto_names = set()

def process_json_file(path, index, total):
    """Extract function names from a JSON file."""
    try:
        # Show progress
        filename = path.name
        print(f"[{index}/{total}] Processing: {filename}... ", end="", flush=True)
        
        with open(path, "r") as f:
            data = json.load(f)

        if "functions" not in data:
            print("✓ (no functions)")
            return

        crypto_count = 0
        noncrypto_count = 0
        
        for func in data["functions"]:
            name = func.get("name", "").strip()
            label = func.get("label", "").lower().strip()

            if not name:
                continue

            if label == "crypto":
                crypto_names.add(name)
                crypto_count += 1
            elif label == "non-crypto":
                noncrypto_names.add(name)
                noncrypto_count += 1

        print(f"✓ (C:{crypto_count}, NC:{noncrypto_count})")

    except Exception as e:
        print(f"✗ ERROR: {e}")

def scan_directory(root):
    """Recursively scan all JSON files."""
    path = Path(root)
    json_files = list(path.rglob("*.json"))

    if not json_files:
        print(f"No JSON files found in: {root}")
        sys.exit(1)

    total = len(json_files)
    print(f"Found {total} JSON files in: {root}")
    print(f"{'='*70}\n")

    for index, jf in enumerate(json_files, start=1):
        process_json_file(jf, index, total)
    
    print(f"\n{'='*70}")
    print("Processing complete!\n")

def write_output():
    """Write results to output text files."""
    print("Writing output files...")
    
    with open("crypto_functions.txt", "w") as f:
        for name in sorted(crypto_names):
            f.write(name + "\n")

    with open("noncrypto_functions.txt", "w") as f:
        for name in sorted(noncrypto_names):
            f.write(name + "\n")

    print(f"\n{'='*70}")
    print("✔ OUTPUT GENERATED")
    print(f"{'='*70}")
    print(f"  📄 crypto_functions.txt — {len(crypto_names)} unique names")
    print(f"  📄 noncrypto_functions.txt — {len(noncrypto_names)} unique names")
    print(f"\n✓ Done!")


def main():
    # Default to ghidra_output folder if no argument provided
    if len(sys.argv) < 2:
        # Assume script is in scripts/ and ghidra_output is in parent directory
        script_dir = Path(__file__).parent
        root = script_dir.parent / "ghidra_output"
        
        if not root.exists():
            print("ERROR: ghidra_output folder not found!")
            print(f"Looked in: {root}")
            print("\nUsage: python3 extract_and_split_crypto_names.py [json_dir]")
            print("  If no directory specified, defaults to ghidra_output/")
            sys.exit(1)
        
        print(f"No directory specified. Using default: {root}\n")
    else:
        root = sys.argv[1]
    
    scan_directory(root)
    write_output()

if __name__ == "__main__":
    main()
