#!/usr/bin/env python3
"""
Crypto Binary Telemetry Collector v5.0
Pure data collection - no interpretation, no verdicts.
Outputs only structured JSON to stdout for downstream LLM analysis.
"""
import os
import sys
import time
import json
import struct
import subprocess
import tempfile
import shutil
import math
from collections import defaultdict
from qiling import Qiling
from qiling.const import QL_VERBOSE

# Import detection modules
from constant_scanner import scan_for_constants
from yara_scanner import YaraCryptoScanner

# Configuration
BINARY_PATH = sys.argv[1] if len(sys.argv) > 1 else ""

# Telemetry storage
telemetry = {
    'metadata': {
        'binary_path': '',
        'architecture': '',
        'timestamp': time.time(),
        'execution_time_seconds': 0,
    },
    'static_analysis': {
        'yara': {
            'detected': [],
            'matches': [],
            'scan_time': 0,
        },
        'constants': {},
        'file_size': 0,
    },
    'syscalls': {
        'getrandom': [],
        'read_random': [],
        'socket': [],
        'mmap': [],
    },
    'execution': {
        'success': False,
        'error_message': '',
        'total_blocks': 0,
        'total_instructions': 0,
    },
    'basic_blocks': [],
    'memory_writes': [],
    'crypto_regions': [],
}

def calculate_entropy(data):
    """Calculate Shannon entropy - raw float value, no thresholds."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    for x in range(256):
        count = data.count(x)
        if count > 0:
            p_x = count / length
            entropy += - p_x * math.log2(p_x)
    return entropy

def detect_architecture(binary_path):
    """Detect architecture from ELF header."""
    try:
        with open(binary_path, 'rb') as f:
            elf_magic = f.read(4)
            if elf_magic != b'\x7fELF':
                return None
            
            ei_class = f.read(1)[0]
            is_64bit = (ei_class == 2)
            
            ei_data = f.read(1)[0]
            is_little_endian = (ei_data == 1)
            
            f.seek(0x12)
            e_machine_bytes = f.read(2)
            
            endian = '<' if is_little_endian else '>'
            e_machine = struct.unpack(f'{endian}H', e_machine_bytes)[0]
            
            arch_map = {
                0x03: 'x86',
                0x3E: 'x86_64',
                0x28: 'arm',
                0xB7: 'arm64',
                0x08: 'mips',
                0xF3: 'riscv',
            }
            
            arch = arch_map.get(e_machine)
            
            if arch == 'mips' and is_64bit:
                arch = 'mips64'
            elif arch == 'riscv':
                arch = 'riscv64' if is_64bit else 'riscv32'
            
            return arch
    except:
        return None

def get_rootfs(binary_path):
    """Get rootfs path based on architecture."""
    arch = detect_architecture(binary_path)
    if not arch:
        return None
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    rootfs_base = os.path.join(os.path.dirname(script_dir), "rootfs")
    
    rootfs_map = {
        'arm64': "arm64_linux",
        'arm': "arm_linux",
        'x86_64': "x8664_linux",
        'x86': "x86_linux",
        'mips': "mips32_linux",
        'mips64': "mips32_linux",
        'riscv64': "riscv64_linux",
        'riscv32': "riscv32_linux",
    }
    
    rootfs_dir = rootfs_map.get(arch)
    if not rootfs_dir:
        return None
    
    rootfs = os.path.join(rootfs_base, rootfs_dir)
    return rootfs if os.path.exists(rootfs) else None

def categorize_instruction(mnemonic):
    """Categorize instruction into buckets for telemetry."""
    mnemonic = mnemonic.lower()
    
    bitwise_ops = ['xor', 'eor', 'pxor', 'vpxor', 'and', 'or', 'orr', 'orn', 'bic', 'not']
    arithmetic_ops = ['add', 'sub', 'adc', 'sbc', 'rsb', 'mul', 'imul', 'div']
    rotate_shift = ['rol', 'ror', 'rrx', 'rotr', 'shl', 'shr', 'sal', 'sar', 'lsl', 'lsr', 'asr', 'sll', 'srl', 'sra']
    data_movement = ['mov', 'ldr', 'str', 'ld', 'st', 'push', 'pop', 'lea']
    
    category = 'other'
    if any(mnemonic.startswith(op) for op in bitwise_ops):
        category = 'bitwise'
    elif any(mnemonic.startswith(op) for op in arithmetic_ops):
        category = 'arithmetic'
    elif any(mnemonic.startswith(op) for op in rotate_shift):
        category = 'rotate_shift'
    elif any(mnemonic.startswith(op) for op in data_movement):
        category = 'data_movement'
    elif mnemonic.startswith('aes') or mnemonic.startswith('sha'):
        category = 'hardware_crypto'
    
    return category

def hook_syscalls(ql):
    """Hook syscalls and log raw arguments - no filtering."""
    global telemetry
    
    def syscall_getrandom(ql, buf, buflen, flags):
        try:
            random_data = os.urandom(buflen)
            ql.mem.write(buf, random_data)
            
            telemetry['syscalls']['getrandom'].append({
                'buffer_address': hex(buf),
                'buffer_size': buflen,
                'flags': flags,
                'data_sample': random_data[:32].hex(),
                'entropy': calculate_entropy(random_data[:min(32, buflen)]),
            })
            
            return buflen
        except:
            return -1
    
    def syscall_read(ql, fd, buf, count):
        try:
            # Check if reading from random device
            if fd in [ql.os.fd.get('/dev/random'), ql.os.fd.get('/dev/urandom')]:
                random_data = os.urandom(count)
                ql.mem.write(buf, random_data)
                
                telemetry['syscalls']['read_random'].append({
                    'fd': fd,
                    'buffer_address': hex(buf),
                    'count': count,
                    'data_sample': random_data[:32].hex(),
                    'entropy': calculate_entropy(random_data[:min(32, count)]),
                })
                
                return count
        except:
            pass
        
        return None
    
    def syscall_socket(ql, domain, socket_type, protocol):
        telemetry['syscalls']['socket'].append({
            'domain': domain,
            'type': socket_type,
            'protocol': protocol,
        })
        return 3  # Return dummy fd
    
    def syscall_mmap(ql, addr, length, prot, flags, fd, offset):
        telemetry['syscalls']['mmap'].append({
            'address': hex(addr) if addr else '0x0',
            'length': length,
            'protection': prot,
            'flags': flags,
            'fd': fd,
            'offset': offset,
        })
        return None  # Let Qiling handle it
    
    try:
        ql.os.set_syscall("getrandom", syscall_getrandom)
        ql.os.set_syscall("read", syscall_read)
        ql.os.set_syscall("socket", syscall_socket)
        ql.os.set_syscall("mmap", syscall_mmap)
    except AttributeError:
        try:
            if hasattr(ql, 'set_syscall'):
                ql.set_syscall("getrandom", syscall_getrandom)
                ql.set_syscall("read", syscall_read)
                ql.set_syscall("socket", syscall_socket)
                ql.set_syscall("mmap", syscall_mmap)
        except:
            pass
    except:
        pass

def profile_basic_block(ql, address, size):
    """Profile basic blocks - collect raw instruction statistics."""
    global telemetry
    
    # Filter library code
    try:
        image = ql.loader.find_containing_image(address)
        if image and image.path:
            if any(lib in image.path.lower() for lib in ['libc', 'ld-linux', 'libm', 'libpthread']):
                return
    except:
        pass
    
    telemetry['execution']['total_blocks'] += 1
    
    # Find existing block or create new
    block_data = None
    for block in telemetry['basic_blocks']:
        if block['address'] == hex(address):
            block_data = block
            break
    
    if not block_data:
        block_data = {
            'address': hex(address),
            'size': size,
            'execution_count': 0,
            'instructions': {
                'bitwise': 0,
                'arithmetic': 0,
                'rotate_shift': 0,
                'data_movement': 0,
                'hardware_crypto': 0,
                'other': 0,
            },
            'total_instructions': 0,
        }
        telemetry['basic_blocks'].append(block_data)
    
    block_data['execution_count'] += 1
    
    # Profile instructions only on first execution
    if block_data['execution_count'] == 1:
        try:
            insn_bytes = ql.mem.read(address, size)
            for insn in ql.arch.disassembler.disasm(insn_bytes, address):
                block_data['total_instructions'] += 1
                telemetry['execution']['total_instructions'] += 1
                
                category = categorize_instruction(insn.mnemonic)
                block_data['instructions'][category] += 1
        except:
            pass

def monitor_memory_write(ql, access, address, size, value):
    """Monitor memory writes - log raw entropy and data, no thresholds."""
    global telemetry
    
    if size >= 16:
        try:
            data = ql.mem.read(address, size)
            entropy = calculate_entropy(data)
            
            telemetry['memory_writes'].append({
                'address': hex(address),
                'size': size,
                'entropy': entropy,
                'data_sample': data[:32].hex(),
            })
        except:
            pass

def collect_telemetry(binary_path):
    """Main telemetry collection function."""
    global telemetry
    
    start_time = time.time()
    
    if not binary_path or not os.path.exists(binary_path):
        telemetry['metadata']['error'] = 'Binary path invalid or does not exist'
        return
    
    telemetry['metadata']['binary_path'] = os.path.abspath(binary_path)
    telemetry['metadata']['architecture'] = detect_architecture(binary_path) or 'unknown'
    telemetry['static_analysis']['file_size'] = os.path.getsize(binary_path)
    
    # YARA scanning
    try:
        yara_scanner = YaraCryptoScanner()
        yara_start = time.time()
        yara_results = yara_scanner.scan_file(binary_path)
        telemetry['static_analysis']['yara'] = {
            'detected': yara_results.get('detected', []),
            'matches': yara_results.get('matches', []),
            'scan_time': time.time() - yara_start,
        }
    except Exception as e:
        telemetry['static_analysis']['yara']['error'] = str(e)
    
    # Constant scanning
    try:
        constant_results = scan_for_constants(binary_path)
        telemetry['static_analysis']['constants'] = constant_results or {}
        
        # Record crypto regions based on constants found
        for algo, constants in (constant_results or {}).items():
            for const in constants:
                telemetry['crypto_regions'].append({
                    'algorithm': algo,
                    'constant_type': const.get('constant', ''),
                    'address': hex(const.get('address', 0)),
                })
    except Exception as e:
        telemetry['static_analysis']['constants_error'] = str(e)
    
    # Get rootfs
    rootfs_path = get_rootfs(binary_path)
    if not rootfs_path:
        telemetry['execution']['error_message'] = 'Could not determine rootfs or architecture'
        telemetry['metadata']['execution_time_seconds'] = time.time() - start_time
        return
    
    # Create temp copy in rootfs
    tmp_path = os.path.join(rootfs_path, "tmp")
    os.makedirs(tmp_path, exist_ok=True)
    temp_dir = tempfile.mkdtemp(dir=tmp_path)
    temp_binary = os.path.join(temp_dir, "test_binary")
    
    try:
        shutil.copy(binary_path, temp_binary)
        
        # Initialize Qiling
        ql = Qiling([temp_binary], rootfs_path, verbose=QL_VERBOSE.OFF, console=False)
        
        # Hook syscalls
        hook_syscalls(ql)
        
        # Hook memory writes
        ql.hook_mem_write(monitor_memory_write)
        
        # Hook basic blocks
        ql.hook_block(profile_basic_block)
        
        # Execute
        try:
            ql.run(timeout=50000000)
            telemetry['execution']['success'] = True
        except Exception as e:
            telemetry['execution']['error_message'] = str(e)
            telemetry['execution']['success'] = False
    
    except Exception as e:
        telemetry['execution']['error_message'] = f'Qiling initialization failed: {str(e)}'
    
    finally:
        try:
            shutil.rmtree(temp_dir)
        except:
            pass
    
    telemetry['metadata']['execution_time_seconds'] = time.time() - start_time

def main():
    """Entry point - collect telemetry and output JSON."""
    if not BINARY_PATH:
        # Output error as JSON to stderr
        sys.stderr.write(json.dumps({'error': 'Usage: python3 verify_crypto_refactored.py <binary_path>'}, indent=2))
        sys.stderr.write('\n')
        sys.exit(1)
    
    # Collect all telemetry
    collect_telemetry(BINARY_PATH)
    
    # Output single JSON object to stdout
    print(json.dumps(telemetry, indent=2))

if __name__ == "__main__":
    main()
