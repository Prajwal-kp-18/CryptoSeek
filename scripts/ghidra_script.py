# Ghidra Headless Analysis Script
# @author PermutationFactory
# @category Analysis

from ghidra.program.model.listing import CodeUnit
import json

def analyze():
    # The 'currentProgram' variable is automatically available in Ghidra scripts
    program_name = currentProgram.getName()
    language_id = currentProgram.getLanguageID().toString()
    compiler_spec = currentProgram.getCompilerSpec().getCompilerSpecID().toString()
    
    print("Analyzing: " + program_name)
    
    # Auto Analysis is performed automatically by analyzeHeadless before this script runs
    # unless -noanalysis is specified. We assume it ran.
    
    # Collect metrics
    function_manager = currentProgram.getFunctionManager()
    function_count = function_manager.getFunctionCount()
    
    instruction_count = 0
    listing = currentProgram.getListing()
    instructions = listing.getInstructions(True) # True = forward
    for _ in instructions:
        instruction_count += 1
        
    # Create a summary object
    summary = {
        "file": program_name,
        "arch": language_id,
        "compiler": compiler_spec,
        "functions": function_count,
        "instructions": instruction_count
    }
    
    # Print JSON to stdout with a special prefix for the analyzer to catch
    print("JSON_RESULT:" + json.dumps(summary))

if __name__ == "__main__":
    analyze()
