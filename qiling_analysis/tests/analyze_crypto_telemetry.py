#!/usr/bin/env python3
"""
Crypto Telemetry Analyzer - LLM Decision Layer
Processes raw telemetry JSON from verify_crypto_refactored.py
Makes classification decisions and generates reports.
"""
import sys
import json
from typing import Dict, List, Any

def analyze_key_size(size_bytes: int) -> Dict[str, Any]:
    """Analyze key/nonce size and return likely algorithms."""
    likely = []
    ruled_out = []
    
    if size_bytes == 8:
        likely = ["XOR-based cipher", "PRNG stream cipher", "Custom cipher", "Weak obfuscation"]
        ruled_out = ["AES", "ChaCha20", "RSA", "DES/3DES"]
    elif size_bytes == 16:
        likely = ["AES-128", "MD5 output"]
    elif size_bytes == 24:
        likely = ["AES-192"]
    elif size_bytes == 32:
        likely = ["AES-256", "ChaCha20", "SHA-256 output"]
    elif size_bytes < 8:
        likely = ["Extremely weak custom cipher", "XOR obfuscation"]
        ruled_out = ["All standard algorithms"]
    else:
        likely = ["Unknown/Custom algorithm"]
    
    return {
        'size_bytes': size_bytes,
        'size_bits': size_bytes * 8,
        'likely_algorithms': likely,
        'ruled_out': ruled_out,
    }

def analyze_syscalls(syscalls: Dict) -> Dict[str, Any]:
    """Analyze syscall telemetry."""
    analysis = {
        'random_generation': {
            'detected': False,
            'sources': [],
            'key_candidates': [],
        },
        'network_activity': {
            'detected': bool(syscalls.get('socket', [])),
            'sockets': len(syscalls.get('socket', [])),
        },
    }
    
    # Analyze getrandom calls
    for call in syscalls.get('getrandom', []):
        analysis['random_generation']['detected'] = True
        analysis['random_generation']['sources'].append('getrandom')
        
        size_analysis = analyze_key_size(call['buffer_size'])
        analysis['random_generation']['key_candidates'].append({
            'size': call['buffer_size'],
            'entropy': call.get('entropy', 0),
            'classification': size_analysis,
        })
    
    # Analyze read from random devices
    for call in syscalls.get('read_random', []):
        analysis['random_generation']['detected'] = True
        analysis['random_generation']['sources'].append('/dev/urandom or /dev/random')
        
        size_analysis = analyze_key_size(call['count'])
        analysis['random_generation']['key_candidates'].append({
            'size': call['count'],
            'entropy': call.get('entropy', 0),
            'classification': size_analysis,
        })
    
    return analysis

def analyze_execution_patterns(telemetry: Dict) -> Dict[str, Any]:
    """Analyze execution patterns from basic blocks."""
    blocks = telemetry.get('basic_blocks', [])
    
    analysis = {
        'total_blocks': len(blocks),
        'total_instructions': telemetry['execution'].get('total_instructions', 0),
        'instruction_distribution': {
            'bitwise': 0,
            'arithmetic': 0,
            'rotate_shift': 0,
            'data_movement': 0,
            'hardware_crypto': 0,
            'other': 0,
        },
        'crypto_loops': [],
        'crypto_intensity': 0.0,
    }
    
    total_crypto_ops = 0
    
    for block in blocks:
        # Aggregate instruction counts
        for category, count in block['instructions'].items():
            analysis['instruction_distribution'][category] += count * block['execution_count']
        
        # Count crypto-relevant operations
        crypto_ops = (
            block['instructions'].get('bitwise', 0) +
            block['instructions'].get('rotate_shift', 0) +
            block['instructions'].get('hardware_crypto', 0)
        )
        total_crypto_ops += crypto_ops * block['execution_count']
        
        # Identify crypto loops (executed multiple times, high crypto-op ratio)
        if block['execution_count'] >= 3 and block['total_instructions'] > 0:
            crypto_ratio = crypto_ops / block['total_instructions']
            if crypto_ratio > 0.3:
                analysis['crypto_loops'].append({
                    'address': block['address'],
                    'executions': block['execution_count'],
                    'crypto_ratio': crypto_ratio,
                    'total_instructions': block['total_instructions'],
                })
    
    # Calculate overall crypto intensity
    if analysis['total_instructions'] > 0:
        analysis['crypto_intensity'] = total_crypto_ops / analysis['total_instructions']
    
    return analysis

def analyze_memory_patterns(memory_writes: List[Dict]) -> Dict[str, Any]:
    """Analyze memory write patterns."""
    analysis = {
        'high_entropy_writes': [],
        'low_entropy_writes': [],
        'medium_entropy_writes': [],
    }
    
    for write in memory_writes:
        entropy = write.get('entropy', 0)
        entry = {
            'address': write['address'],
            'size': write['size'],
            'entropy': entropy,
        }
        
        if entropy > 7.5:  # Very high entropy
            analysis['high_entropy_writes'].append(entry)
        elif entropy < 5.0:  # Low entropy
            analysis['low_entropy_writes'].append(entry)
        else:
            analysis['medium_entropy_writes'].append(entry)
    
    return analysis

def classify_algorithm(telemetry: Dict) -> Dict[str, Any]:
    """Main classification logic."""
    classification = {
        'verdict': 'UNKNOWN',
        'confidence': 'LOW',
        'evidence': {
            'standard_algorithms': {},
            'proprietary_indicators': [],
        },
        'recommendations': [],
    }
    
    # Evidence scoring
    score = 0
    
    # 1. Check YARA detections
    yara_detected = telemetry['static_analysis']['yara'].get('detected', [])
    if yara_detected:
        for algo in yara_detected:
            if algo not in classification['evidence']['standard_algorithms']:
                classification['evidence']['standard_algorithms'][algo] = []
            classification['evidence']['standard_algorithms'][algo].append('YARA signature match')
        score += 40
    
    # 2. Check constants
    constants = telemetry['static_analysis'].get('constants', {})
    if constants:
        for algo, const_list in constants.items():
            if algo not in classification['evidence']['standard_algorithms']:
                classification['evidence']['standard_algorithms'][algo] = []
            classification['evidence']['standard_algorithms'][algo].append(
                f'{len(const_list)} cryptographic constants found'
            )
        score += 35
    
    # 3. Analyze syscalls
    syscall_analysis = analyze_syscalls(telemetry['syscalls'])
    if syscall_analysis['random_generation']['detected']:
        for candidate in syscall_analysis['random_generation']['key_candidates']:
            if candidate['size'] <= 8:
                classification['evidence']['proprietary_indicators'].append(
                    f"Small key/nonce ({candidate['size']} bytes) suggests custom cipher"
                )
                score -= 10
            elif candidate['size'] in [16, 24, 32]:
                classification['evidence']['proprietary_indicators'].append(
                    f"Standard key size ({candidate['size']} bytes) detected"
                )
                score += 15
    
    # 4. Analyze execution patterns
    exec_analysis = analyze_execution_patterns(telemetry)
    if exec_analysis['crypto_loops']:
        loop_count = len(exec_analysis['crypto_loops'])
        if loop_count >= 10:
            classification['evidence']['proprietary_indicators'].append(
                f'{loop_count} crypto loops detected (standard round functions)'
            )
            score += 20
        elif loop_count >= 3:
            classification['evidence']['proprietary_indicators'].append(
                f'{loop_count} crypto loops detected'
            )
            score += 10
    
    if exec_analysis['crypto_intensity'] > 0.1:
        classification['evidence']['proprietary_indicators'].append(
            f"High crypto-op intensity ({exec_analysis['crypto_intensity']:.1%})"
        )
        score += 10
    
    # 5. Check for no constants (proprietary indicator)
    if not constants and not yara_detected:
        classification['evidence']['proprietary_indicators'].append(
            "No known cryptographic constants detected"
        )
        classification['verdict'] = 'PROPRIETARY/CUSTOM'
        score = max(score, 25)
    
    # Final verdict
    if classification['evidence']['standard_algorithms']:
        best_algo = max(
            classification['evidence']['standard_algorithms'].items(),
            key=lambda x: len(x[1])
        )
        classification['verdict'] = f"STANDARD: {best_algo[0]}"
        
        if score >= 60:
            classification['confidence'] = 'HIGH'
            classification['recommendations'].append(
                f"Binary appears to use {best_algo[0]}. Verify implementation correctness."
            )
        elif score >= 35:
            classification['confidence'] = 'MEDIUM'
            classification['recommendations'].append(
                f"Likely uses {best_algo[0]}, but requires manual verification."
            )
    else:
        classification['verdict'] = 'PROPRIETARY/CUSTOM'
        classification['confidence'] = 'MEDIUM' if score >= 25 else 'LOW'
        classification['recommendations'].append(
            "Custom/proprietary cipher detected. Replace with standard algorithms like AES-256-GCM or ChaCha20-Poly1305."
        )
    
    classification['score'] = score
    
    return classification

def generate_report(telemetry: Dict) -> Dict[str, Any]:
    """Generate comprehensive analysis report."""
    report = {
        'metadata': telemetry['metadata'],
        'syscall_analysis': analyze_syscalls(telemetry['syscalls']),
        'execution_analysis': analyze_execution_patterns(telemetry),
        'memory_analysis': analyze_memory_patterns(telemetry.get('memory_writes', [])),
        'classification': classify_algorithm(telemetry),
    }
    
    return report

def main():
    """Read telemetry JSON from stdin and output analysis."""
    if len(sys.argv) > 1:
        # Read from file
        with open(sys.argv[1], 'r') as f:
            telemetry = json.load(f)
    else:
        # Read from stdin
        telemetry = json.load(sys.stdin)
    
    # Generate report
    report = generate_report(telemetry)
    
    # Output to stdout
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
