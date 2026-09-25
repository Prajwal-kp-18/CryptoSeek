#!/usr/bin/env python3
"""
Crypto Function Labeler
Classifies functions based on pre-extracted features in JSON files.
"""

import json
import sys
import os

def classify_function(func_data):
    """
    Classifies a function based on extracted crypto features.
    Returns: 'AES', 'RSA', 'SHA', 'ECC', 'Other Crypto', 'Compression', or 'Non-Crypto'
    """
    
    # 1. Extract Helper Sub-objects
    sigs = func_data.get("crypto_signatures", {})
    adv = func_data.get("advanced_features", {})
    ops = func_data.get("op_category_counts", {})
    entropy = func_data.get("entropy_metrics", {})
    
    # =========================================================
    # TIER 1: HIGH CONFIDENCE CRYPTO (Explicit Signatures)
    # =========================================================
    
    # AES (Rijndael)
    if sigs.get("has_aes_sbox") == 1 or \
       sigs.get("has_aes_rcon") == 1 or \
       adv.get("aes_sbox_match_score", 0) > 0.8:
        return "AES"

    # SHA Family / MD5
    if sigs.get("has_sha_constants") == 1 or \
       adv.get("sha_k_table_hits", 0) > 0 or \
       adv.get("sha_init_constants_hits", 0) > 0:
        return "Hashing (SHA/MD5)"

    # RSA / BigInt
    if sigs.get("rsa_bigint_detected") == 1 or \
       adv.get("modexp_op_density", 0) > 0.1:
        return "RSA"

    # ECC (Elliptic Curve)
    if adv.get("curve25519_constant_detection") is True or \
       adv.get("montgomery_op_count", 0) > 0:
        # Refinement: Montgomery Ladder
        if adv.get("ladder_step_count", 0) > 0:
            return "ECC (Montgomery Ladder)"
        return "ECC"

    # ChaCha20 / Salsa20
    if adv.get("quarterround_score", 0) > 2:
        return "ChaCha20/Salsa20"

    # =========================================================
    # TIER 2: COMPRESSION (ZLIB / DEFLATE)
    # =========================================================
    
    # Logic: Compression has high entropy but usually LOW bitwise complexity compared to crypto.
    
    is_high_entropy = entropy.get("function_byte_entropy", 0) > 5.5
    low_bitwise_complexity = ops.get("bitwise_ops", 0) < 10
    
    # Check if a ZLIB header signature was detected (assuming mapped from YARA if available)
    zlib_detected = sigs.get("has_zlib_headers", 0) == 1 
    
    if zlib_detected or (is_high_entropy and low_bitwise_complexity):
        return "Compression (ZLIB/Packed)"

    # =========================================================
    # TIER 3: HEURISTIC / PROPRIETARY CRYPTO
    # =========================================================
    
    # Logic: High entropy AND high bitwise complexity = Likely Unknown Crypto
    
    has_crypto_ops = ops.get("crypto_like_ops", 0) > 5
    is_complex_bitwise = (ops.get("bitwise_ops", 0) > 15 and ops.get("xor_ratio", 0) > 0.05)
    
    if is_high_entropy and (has_crypto_ops or is_complex_bitwise):
        return "Other Crypto"

    # =========================================================
    # TIER 4: NON-CRYPTO
    # =========================================================
    return "Non-Crypto"

def process_json_file(input_path, output_path):
    try:
        with open(input_path, 'r') as f:
            data = json.load(f)
        
        # Handle list vs dict structure
        functions_list = data if isinstance(data, list) else data.get("functions", [])

        labeled_count = 0
        for func in functions_list:
            label = classify_function(func)
            func["label"] = label
            labeled_count += 1
            
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=4)
            
        print(f"Processed {labeled_count} functions.")
        print(f"Saved to: {output_path}")

    except Exception as e:
        print(f"Error processing file {input_path}: {e}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 label_crypto.py <input_json> <output_json>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        sys.exit(1)
        
    process_json_file(input_path, output_path)

if __name__ == "__main__":
    main()
