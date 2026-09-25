import os
import subprocess
import time

# --- CONFIGURATION ---
# Robust path handling: relative to this script
# SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
# SOURCE_DIR = os.path.join(PROJECT_ROOT, "source_code")
# OUTPUT_DIR = os.path.join(PROJECT_ROOT, "dataset_binaries")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))       
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))  

SOURCE_DIR = os.path.join(PROJECT_ROOT, "source_code", "testingfiles")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "test_dataset_binaries")

# Map generic names to specific compiler commands available in the Docker container
TARGETS = {
    "x86":   {"gcc": "gcc", "clang": "clang -target x86_64-linux-gnu"},
    "arm":   {"gcc": "arm-linux-gnueabihf-gcc", "clang": "clang -target arm-linux-gnueabihf"},
    "mips":  {"gcc": "mips-linux-gnu-gcc", "clang": "clang -target mips-linux-gnu"},
    "avr":   {"avr-gcc": "avr-gcc -mmcu=atmega328p"}, # Common AVR MCU
    "riscv": {"riscv64-linux-gnu-gcc": "riscv64-linux-gnu-gcc", "clang": "clang -target riscv64-linux-gnu"},
    "z80":   {"sdcc": "sdcc -mz80"}
}
OPTIMIZATIONS = ["-O0", "-O1", "-O2", "-O3", "-Os"]

def get_build_command(compiler_cmd, opt, output_path, source_path):
    """Constructs the build command based on the compiler."""
    
    # SDCC (Z80) specific handling
    if "sdcc" in compiler_cmd:
        # SDCC flags are different
        # Map -O flags to SDCC equivalents roughly
        sdcc_opt = ""
        if opt == "-O0": sdcc_opt = "--no-peep"
        elif opt == "-Os": sdcc_opt = "--opt-code-size"
        elif opt in ["-O1", "-O2", "-O3"]: sdcc_opt = "--opt-code-speed"
        
        # SDCC output flag is -o but expects full filename or just directory? 
        # SDCC -o <file> works for .ihx usually. 
        # But we want .elf? SDCC produces .ihx by default. 
        # We will let it produce .ihx and rename or just accept it.
        # However, for this dataset, we might want to just output what it produces.
        # Note: SDCC might not support -g or -fno-inline the same way.
        # --debug for debug info (creates .cdb)
        
        return f"{compiler_cmd} {sdcc_opt} --debug -o {output_path} {source_path}"
    
    # GCC / Clang (Standard)
    else:
        return f"{compiler_cmd} {opt} -g -fno-inline -o {output_path} {source_path}"

import sys

def build_dataset():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    sources = [f for f in os.listdir(SOURCE_DIR) if f.endswith(".c")]
    
    # Filter by argument if provided
    if len(sys.argv) > 1:
        filter_str = sys.argv[1]
        sources = [s for s in sources if filter_str in s]
    
    print(f"🏭 Starting Factory. Found {len(sources)} algorithms.")
    
    # Calculate total combinations
    total_combos = 0
    for arch, compilers in TARGETS.items():
        total_combos += len(compilers) * len(OPTIMIZATIONS)
    print(f"   Matrix: {len(sources)} Algos x {total_combos} combos")

    for source in sources:
        algo_name = source.replace(".c", "")
        # Path inside Docker. We mount PROJECT_ROOT to /work
        source_path = os.path.join("/work/source_code/testingfiles/", source)


        for arch, compilers in TARGETS.items():
            for comp_name, comp_cmd in compilers.items():
                for opt in OPTIMIZATIONS:
                    # Naming Convention: algo_arch_compiler_opt.elf
                    # Example: aes_arm_gcc_O3.elf
                    filename = f"{algo_name}_{arch}_{comp_name}_{opt.replace('-', '')}.elf"
                    output_path = os.path.join("/work/test_dataset_binaries", filename)
                    
                    # Construct Build Command
                    cmd = get_build_command(comp_cmd, opt, output_path, source_path)
                    
                    # Run in Docker
                    docker_cmd = [
                        "docker", "run", "--rm",
                        "-v", f"{PROJECT_ROOT}:/work", # Mount project root
                        "ntro-builder",
                        "/bin/bash", "-c", cmd
                    ]
                    
                    try:
                        # Capture stderr to debug failures
                        result = subprocess.run(docker_cmd, check=True, capture_output=True, text=True)
                        print(f"✅ Built: {filename}")
                    except subprocess.CalledProcessError as e:
                        print(f"❌ Failed: {filename}")
                        # Only print error if it's not just a warning or common noise, 
                        # but for now print all to be safe
                        if e.stderr:
                            print(f"   Error: {e.stderr.strip()[:200]}...") # Truncate long errors

if __name__ == "__main__":
    build_dataset()
