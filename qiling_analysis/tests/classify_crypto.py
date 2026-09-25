#!/usr/bin/env python3
"""
Crypto Architecture Classifier v1.0
Classifies cryptographic algorithms into architectural styles:
- SPN (Substitution-Permutation Network)
- Feistel Network
- Lai-Massey Scheme
- ARX (Add-Rotate-Xor)
- Sponge Construction
"""

import os
import sys
import subprocess
import shutil
import tempfile
import re
import math
import time
import json
from collections import defaultdict
from qiling import Qiling
from qiling.const import QL_VERBOSE, QL_INTERCEPT

# Import modules (assuming these exist in the same dir)
try:
    from constant_scanner import scan_for_constants, print_scan_results
    from crypto_logger import CryptoLogger
    from yara_scanner import YaraCryptoScanner
    from unpacker import BinaryUnpacker
except ImportError:
    # Fallback if modules are missing (for standalone testing)
    scan_for_constants = lambda x: {}
    CryptoLogger = None
    YaraCryptoScanner = None
    BinaryUnpacker = None

# Configuration
BINARY_PATH = sys.argv[1] if len(sys.argv) > 1 else ""
UNPACKED_BINARY_PATH = None

# Global logger instance
logger = None
jsonl_logger = None

# Profiling stats
stats_total_blocks = 0
basic_blocks = {}
syscall_events = {
    'getrandom_calls': [],
    'random_reads': [],
    'memory_operations': [],
}

class JsonlLogger:
    def __init__(self, filename="trace.jsonl"):
        self.filename = filename
        self.file = open(filename, "w")
    
    def log_block(self, address, size, mnemonics, has_crypto):
        event = {
            "type": "basic_block",
            "data": {
                "address": hex(address),
                "size": size,
                "mnemonics": mnemonics,
                "has_crypto_patterns": has_crypto,
                "bytes_hash": hex(hash(tuple(mnemonics))) # Simple hash for demo
            }
        }
        self.file.write(json.dumps(event) + "\n")
        self.file.flush()

    def log_syscall(self, name, entropy=0.0):
        event = {
            "type": "syscall",
            "data": {
                "name": name,
                "entropy": entropy,
                "likely_encrypted": entropy > 3.5
            }
        }
        self.file.write(json.dumps(event) + "\n")
        self.file.flush()
        
    def close(self):
        self.file.close()

# --- ARCHITECTURE CLASSIFIER ---
class ArchitectureClassifier:
    def __init__(self):
        self.scores = {
            'SPN': 0,
            'Feistel': 0,
            'Lai-Massey': 0,
            'ARX': 0,
            'Sponge': 0
        }
        self.evidence = defaultdict(list)
        self.op_counts = defaultdict(int)
        self.memory_access_patterns = []
        self.block_width_hints = []

    def log_op(self, mnemonic, operands):
        """Log instruction for architectural analysis"""
        mnemonic = mnemonic.lower()
        
        # ARX Detection: Add, Rotate, Xor
        if mnemonic in ['add', 'adc', 'sub']:
            self.op_counts['ARX_ADD'] += 1
        elif mnemonic in ['rol', 'ror', 'shl', 'shr', 'sal', 'sar']:
            self.op_counts['ARX_ROT'] += 1
        elif mnemonic in ['xor', 'pxor', 'eor']:
            self.op_counts['ARX_XOR'] += 1
            
        # SPN/Feistel: Look for specific patterns (harder on instruction level)
        # We rely more on memory patterns for S-Boxes (SPN)
        if mnemonic in ['xchg', 'bswap']:
            self.op_counts['SWAP_OP'] += 1
        
        # Sponge: Check for large state operations (vector ops)
        if mnemonic.startswith('v') or mnemonic.startswith('xmm'):
            self.op_counts['VECTOR_OP'] += 1

    def analyze_memory_access(self, address, size, rw_type, data):
        """Analyze memory access for S-Box or State patterns"""
        # S-Box Detection: Frequent reads from small tables
        # We'll aggregate this later, just tracking here
        pass

    def finalize_classification(self):
        """Compute final scores based on collected metrics"""
        
        # Aggregation: Only count ops from blocks marked as loops (to filter init/printf noise)
        # We need to re-tally based on basic_blocks data
        self.op_counts.clear()
        
        loop_blocks = 0
        for addr, info in basic_blocks.items():
            if info.get('is_loop', False):
                loop_blocks += 1
                # We need to re-parse or store the ops. 
                # Since we didn't store per-block ops list (only mnemonics in jsonl), 
                # we will rely on the fact that we can't easily re-disassemble without storing.
                # FIX: Let's assume the 'mnemonics' list in info (if we add it) or just use the global counts 
                # BUT filtered by the fact that we only want "crypto-dense" loops.
                pass

        # RE-IMPLEMENTATION: We need to store ops per block to filter properly.
        # Since we can't go back, let's modify the hook to store ops in block_info.
        pass
        
    def analyze_block_ops(self, block_info):
        """Analyze ops for a specific block and update global counts"""
        for mnemonic in block_info.get('mnemonics', []):
            self.log_op(mnemonic, "")

class ArchitectureClassifier:
    def __init__(self):
        self.scores = {
            'SPN': 0,
            'Feistel': 0,
            'Lai-Massey': 0,
            'ARX': 0,
            'Sponge': 0
        }
        self.evidence = defaultdict(list)
        self.op_counts = defaultdict(int)
        self.memory_access_patterns = []

    def log_op(self, mnemonic, operands):
        """Log instruction for architectural analysis"""
        mnemonic = mnemonic.lower()
        
        # ARX Detection: Add, Rotate, Xor
        if mnemonic in ['add', 'adc', 'sub']:
            self.op_counts['ARX_ADD'] += 1
        elif mnemonic in ['rol', 'ror', 'shl', 'shr', 'sal', 'sar']:
            self.op_counts['ARX_ROT'] += 1
        elif mnemonic in ['xor', 'pxor', 'eor']:
            self.op_counts['ARX_XOR'] += 1
            
        # SPN/Feistel: Look for specific patterns
        if mnemonic in ['xchg', 'bswap']:
            # Ignore NOPs (xchg ax, ax)
            if 'ax, ax' not in operands:
                self.op_counts['SWAP_OP'] += 1
        elif mnemonic.startswith('mov'):
            self.op_counts['MOV_OP'] += 1
        
        # Sponge: Check for large state operations (vector ops)
        if mnemonic.startswith('v') or mnemonic.startswith('xmm'):
            self.op_counts['VECTOR_OP'] += 1

    def finalize_classification(self):
        """Compute final scores based on collected metrics"""
        
        # Filter: Only consider ops from Crypto Loops
        filtered_counts = defaultdict(int)
        total_loop_ops = 0
        
        for info in basic_blocks.values():
            if info.get('is_loop', False) and info.get('is_word_op', False):
                for mnemonic in info.get('mnemonics', []):
                    total_loop_ops += 1
                    if mnemonic in ['add', 'adc', 'sub', 'lea']: filtered_counts['ARX_ADD'] += 1
                    elif mnemonic in ['rol', 'ror', 'shl', 'shr', 'sal', 'sar']: filtered_counts['ARX_ROT'] += 1
                    elif mnemonic in ['xor', 'pxor', 'eor']: filtered_counts['ARX_XOR'] += 1
                    elif mnemonic in ['xchg', 'bswap']: filtered_counts['SWAP_OP'] += 1
                    elif mnemonic.startswith('mov'): filtered_counts['MOV_OP'] += 1
                    elif mnemonic.startswith('v') or mnemonic.startswith('xmm'): filtered_counts['VECTOR_OP'] += 1
        
        # Add S-Box lookups (global count, not filtered by loop yet)
        filtered_counts['SBOX_LOOKUP'] = self.op_counts['SBOX_LOOKUP']

        # Use filtered counts for scoring
        self.op_counts = filtered_counts
        
        # DEBUG: Print raw counts
        print(f"\n[DEBUG] Loop Op Counts: {dict(self.op_counts)}")
        
        # 1. ARX Scoring
        total_ops = total_loop_ops
        if total_ops > 0:
            arx_ops = self.op_counts['ARX_ADD'] + self.op_counts['ARX_ROT'] + self.op_counts['ARX_XOR']
            mov_ops = self.op_counts['MOV_OP']
            
            arx_ratio = arx_ops / total_ops
            mov_ratio = mov_ops / total_ops
            
            # DEBUG: Print ratios
            print(f"\n[DEBUG] Loop Ops: {total_ops}")
            print(f"[DEBUG] ARX Ops: {arx_ops} (Ratio: {arx_ratio:.2f})")
            print(f"[DEBUG] MOV Ops: {mov_ops} (Ratio: {mov_ratio:.2f})")
            
            # ARX usually has VERY high density (>40%), but with overhead >15% is significant
            if arx_ratio > 0.15:
                self.scores['ARX'] += 50
                self.evidence['ARX'].append(f"High ARX operation density ({arx_ratio:.1%})")
            
            if self.op_counts['ARX_ADD'] > 0 and self.op_counts['ARX_ROT'] > 0 and self.op_counts['ARX_XOR'] > 0:
                self.scores['ARX'] += 20
                self.evidence['ARX'].append("Balanced Mix of Add/Rotate/Xor")

        # 2. SPN/Feistel Scoring (S-Box)
        if self.op_counts.get('SBOX_LOOKUP', 0) > 5: # Lower threshold
            # If we have loops + S-Box, it could be SPN or Feistel
            # If we also have high MOV ratio, favor Feistel
            self.scores['SPN'] += 40
            self.evidence['SPN'].append(f"Detected {self.op_counts['SBOX_LOOKUP']} S-Box lookups")
            
            # Also add to Feistel if structure suggests it
            if total_ops > 0 and mov_ops / total_ops > 0.3:
                 self.scores['Feistel'] += 50
                 self.evidence['Feistel'].append("S-Box lookups with high data movement (Feistel)")

        # 3. Feistel (Non-SBox)
        # If we have significant ARX ops but also high MOV ratio, it's likely Feistel
        if total_ops > 0:
            if arx_ratio > 0.15:
                if mov_ratio > 0.3: # Feistel usually has > 30% moves
                    self.scores['Feistel'] += 40
                    self.evidence['Feistel'].append(f"High Data Movement ({mov_ratio:.1%}) with ARX ops - Typical of Feistel")
            elif mov_ratio < 0.25: # Pure ARX usually has < 25% moves
                self.scores['ARX'] += 10
                self.evidence['ARX'].append(f"Low Data Movement ({mov_ratio:.1%}) - Typical of pure ARX")
            
            if self.op_counts['SWAP_OP'] > 0:
                self.scores['Feistel'] += 30
                self.evidence['Feistel'].append("Explicit register swaps detected")
        # 4. Sponge
        # Large state updates (Absorb/Squeeze)
        # Look for XORs with input data followed by permutations
        if self.op_counts.get('STATE_ABSORB', 0) > 0:
            self.scores['Sponge'] += 50
            self.evidence['Sponge'].append("Detected Sponge Absorb phase")

        # 5. S-Box Detection (SPN vs Feistel)
        # Analyze memory access patterns for S-Box lookups
        # Heuristic: Dense reads in a small range (e.g., 256 bytes)
        # Refinement: Check for RANDOM access (S-Box) vs SEQUENTIAL (Constants/Arrays)
        
        sbox_candidates = 0
        unique_reads = sorted(list(set(self.memory_access_patterns)))
        
        if unique_reads:
            # 1. Cluster addresses into tables
            clusters = []
            if unique_reads:
                current_cluster = [unique_reads[0]]
                for addr in unique_reads[1:]:
                    if addr - current_cluster[-1] < 64: # Close proximity
                        current_cluster.append(addr)
                    else:
                        if len(current_cluster) > 16: # Min size for a table
                            clusters.append(current_cluster)
                        current_cluster = [addr]
                if len(current_cluster) > 16:
                    clusters.append(current_cluster)
            
            # 2. Analyze access pattern for each cluster
            for cluster in clusters:
                min_addr = cluster[0]
                max_addr = cluster[-1]
                span = max_addr - min_addr
                
                if 200 <= span <= 4096: # S-Box size (256) or larger tables (4KB)
                    # Extract accesses to this cluster from the chronological log
                    # Optimization: This can be slow if log is huge. 
                    # We'll just check a sample or iterate once if needed.
                    # For this script, we'll iterate.
                    
                    cluster_accesses = [a for a in self.memory_access_patterns if min_addr <= a <= max_addr]
                    
                    if len(cluster_accesses) < 10: continue

                    # Check for sequentiality
                    is_sequential = True
                    stride_violations = 0
                    for i in range(1, len(cluster_accesses)):
                        diff = abs(cluster_accesses[i] - cluster_accesses[i-1])
                        if diff > 16: # Arbitrary small stride
                            stride_violations += 1
                    
                    # If many jumps, it's random access -> S-Box
                    if stride_violations > len(cluster_accesses) * 0.3:
                        sbox_candidates += 1
                        # print(f"[DEBUG] Random Access Table detected at {hex(min_addr)} (Size: {span})")
                    else:
                        pass
                        # print(f"[DEBUG] Sequential Table detected at {hex(min_addr)} (Size: {span}) - Likely Constants")
        
        if sbox_candidates > 0:
            print(f"[DEBUG] S-Box Candidates Detected: {sbox_candidates}")
            
            # SPN relies heavily on S-Boxes
            self.scores['SPN'] += 50 * sbox_candidates
            self.evidence['SPN'].append(f"Detected {sbox_candidates} potential S-Box tables")

        return self.scores, self.evidence

    def log_memory_access(self, address):
        self.memory_access_patterns.append(address)

classifier = ArchitectureClassifier()

# --- HELPER FUNCTIONS ---

def get_entropy(data):
    if not data: return 0
    entropy = 0
    length = len(data)
    for x in range(256):
        count = data.count(x)
        if count > 0:
            p_x = count / length
            entropy += - p_x * math.log2(p_x)
    return entropy

def is_crypto_op(mnemonic):
    crypto_ops = [
        'xor', 'eor', 'pxor', 'vpxor', 'rol', 'ror', 'rrx', 'rotr',
        'shl', 'shr', 'sal', 'sar', 'lsl', 'lsr', 'asr', 'sll', 'srl', 'sra',
        'add', 'sub', 'adc', 'sbc', 'rsb', 'and', 'or', 'orr', 'orn', 'bic',
        'not', 'neg', 'mvn', 'aes', 'sha'
    ]
    return any(mnemonic.startswith(op) for op in crypto_ops)

# --- HOOKS ---

def profile_basic_block(ql, address, size):
    """Hook basic blocks to detect crypto ops and architectural patterns."""
    global stats_total_blocks, basic_blocks, classifier, jsonl_logger
    
    # Skip libraries
    try:
        image = ql.loader.find_containing_image(address)
        if image and image.path:
            if any(lib in image.path.lower() for lib in ['libc', 'ld-linux', 'libm', 'libpthread']):
                return
    except: pass
    
    stats_total_blocks += 1
    
    if address not in basic_blocks:
        basic_blocks[address] = {
            'exec_count': 0, 'crypto_ops': 0, 'total_ops': 0, 'is_loop': False, 'size': size
        }
    
    block_info = basic_blocks[address]
    block_info['exec_count'] += 1
    
    if block_info['exec_count'] >= 3:
        block_info['is_loop'] = True
        classifier.op_counts['CRYPTO_LOOP'] = 1 # Mark presence
    
    # Analyze instructions on first run
    if block_info['exec_count'] == 1:
        mnemonics = []
        has_crypto = False
        is_word_op = False
        try:
            insn_bytes = ql.mem.read(address, size)
            for insn in ql.arch.disassembler.disasm(insn_bytes, address):
                block_info['total_ops'] += 1
                mnemonic = insn.mnemonic.lower()
                mnemonics.append(mnemonic)
                
                # Check operand size (heuristic based on register names)
                # x86: eax, ebx, rax, rbx, etc.
                if 'eax' in insn.op_str or 'rax' in insn.op_str or \
                   'ebx' in insn.op_str or 'rbx' in insn.op_str or \
                   'ecx' in insn.op_str or 'rcx' in insn.op_str or \
                   'edx' in insn.op_str or 'rdx' in insn.op_str or \
                   'esi' in insn.op_str or 'rsi' in insn.op_str or \
                   'edi' in insn.op_str or 'rdi' in insn.op_str:
                    is_word_op = True
                
                if is_crypto_op(mnemonic):
                    block_info['crypto_ops'] += 1
                    has_crypto = True
                
                # Feed to classifier
                classifier.log_op(mnemonic, insn.op_str)
            
            # Store for classification
            block_info['mnemonics'] = mnemonics
            block_info['is_word_op'] = is_word_op

            # Log to JSONL
            if jsonl_logger:
                jsonl_logger.log_block(address, size, mnemonics, has_crypto)
                
        except: pass

def monitor_memory_read(ql, access, address, size, value):
    """Hook memory reads to detect S-Box lookups (SPN)."""
    # Heuristic: Reads from a small, constant table in .rodata or data section
    # We check if the address is within a known data range (simplified)
    # Or we just count reads that are NOT code fetches (which this hook does)
    
    # We need to filter out stack reads (local vars) and code reads.
    # Stack usually high address. Code usually low. Data in between.
    # This is rough without section info.
    
    # Better: Check if the read address is "close" to previous read addresses (locality)
    # but with random offsets (S-Box lookup).
    
    # Simplified: Just count reads. If we have many reads + bitwise ops, it's SPN/Feistel.
    # ARX has very few memory reads (only initial load/final store).
    
    # Filter stack reads (heuristic: very high address or close to SP)
    try:
        sp = ql.arch.regs.read(ql.arch.sp_reg)
        if abs(address - sp) < 0x10000: # Stack read
            return
    except: pass
    
    # DEBUG: Print memory access
    # print(f"[DEBUG] Mem Read: {hex(address)}")
    
    classifier.op_counts['MEM_READ'] += 1
    
    # If we see many reads from a small region (256 bytes), it's likely an S-Box
    # We can track read addresses.
    classifier.memory_access_patterns.append(address)
    
    # Analyze pattern periodically or at end
    if len(classifier.memory_access_patterns) > 50: # Lower threshold
        # Check for S-Box pattern: reads confined to small range
        addrs = classifier.memory_access_patterns[-50:]
        min_addr = min(addrs)
        max_addr = max(addrs)
        # S-Box is usually 256 bytes or 4KB.
        # If range is small AND we have enough reads
        if (max_addr - min_addr) <= 4096:
             classifier.op_counts['SBOX_LOOKUP'] += 1
             # Reset to avoid overcounting
             classifier.memory_access_patterns = [] 

# --- ANALYSIS ---

def run_analysis(binary_path, rootfs_path):
    """Run the analysis with Qiling."""
    global classifier, jsonl_logger
    
    # Initialize logger
    jsonl_logger = JsonlLogger("trace.jsonl")
    
    # Create temp copy
    tmp_path = os.path.join(rootfs_path, "tmp")
    os.makedirs(tmp_path, exist_ok=True)
    temp_dir = tempfile.mkdtemp(dir=tmp_path)
    temp_binary = os.path.join(temp_dir, "test_binary")
    shutil.copy(binary_path, temp_binary)
    
    try:
        ql = Qiling([temp_binary], rootfs_path, verbose=QL_VERBOSE.OFF, console=False)
        
        # Install Hooks
        ql.hook_block(profile_basic_block)
        ql.hook_mem_read(monitor_memory_read) # Enabled for S-Box detection
        
        print("[*] Running architectural analysis...")
        try:
            ql.run(timeout=50000000)
        except Exception as e:
            print(f"[!] Execution error: {e}")
            
        # Finalize Classification
        scores, evidence = classifier.finalize_classification()
        
        print("\n" + "="*70)
        print("   ARCHITECTURAL CLASSIFICATION REPORT")
        print("="*70)
        
        # Determine winner
        best_arch = max(scores, key=scores.get)
        best_score = scores[best_arch]
        
        if best_score > 0:
            print(f"\n[*] Primary Architecture: {best_arch} (Score: {best_score})")
        else:
            print(f"\n[*] Primary Architecture: UNKNOWN")
            
        print("\n[*] Detailed Scores:")
        for arch, score in scores.items():
            print(f"    - {arch}: {score}")
            for ev in evidence.get(arch, []):
                print(f"      -> {ev}")
                
        # Comparative Summary Table (as requested)
        print("\n[*] Comparative Summary:")
        print(f"{'Feature':<20} {'SPN (AES)':<20} {'Feistel (DES)':<20} {'ARX (ChaCha)':<20} {'Sponge (SHA-3)':<20}")
        print("-" * 100)
        print(f"{'Component':<20} {'S-Boxes + P-Boxes':<20} {'Split halves':<20} {'Add, Rotate, XOR':<20} {'Absorb & Squeeze':<20}")
        
        # Highlight likely match
        if best_score > 30:
            print(f"\n[+] Conclusion: Binary likely implements a {best_arch}-based algorithm.")
        else:
            print(f"\n[?] Conclusion: Insufficient evidence to classify architecture.")

    finally:
        if jsonl_logger:
            jsonl_logger.close()
        shutil.rmtree(temp_dir)

# --- MAIN ---

def main():
    if not BINARY_PATH or not os.path.exists(BINARY_PATH):
        print("Usage: python3 classify_crypto.py <binary_path>")
        sys.exit(1)
        
    # Detect Rootfs (reuse logic from verify_crypto if possible, or simplified)
    # For now, assuming user provides correct environment or we auto-detect
    # I'll copy the get_rootfs logic briefly or import it if I could.
    # Since I'm writing a standalone-ish script, I'll include a simplified get_rootfs.
    
    # ... (Include get_rootfs and detect_architecture from verify_crypto) ...
    # To save space, I will assume the user has the environment set up or I'll paste the essential parts.
    # I will paste the essential parts of get_rootfs here.
    
    rootfs_path = get_rootfs(BINARY_PATH)
    if rootfs_path:
        run_analysis(BINARY_PATH, rootfs_path)
    else:
        print("[-] Could not determine rootfs.")

def detect_architecture(binary_path):
    import struct
    try:
        with open(binary_path, 'rb') as f:
            if f.read(4) != b'\x7fELF': return None
            f.seek(0x12)
            e_machine = struct.unpack('<H', f.read(2))[0] # Assume LE for simplicity or check
            # Simple map
            if e_machine == 0x3E: return 'x86_64'
            if e_machine == 0x28: return 'arm'
            if e_machine == 0x08: return 'mips'
            return 'x86_64' # Default fallback
    except: return None

def get_rootfs(binary_path):
    # Simplified rootfs finder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    rootfs_base = os.path.join(os.path.dirname(script_dir), "rootfs")
    arch = detect_architecture(binary_path)
    
    map_ = {
        'x86_64': 'x8664_linux',
        'arm': 'arm_linux',
        'mips': 'mips32_linux'
    }
    if arch in map_:
        return os.path.join(rootfs_base, map_[arch])
    return None

if __name__ == "__main__":
    main()