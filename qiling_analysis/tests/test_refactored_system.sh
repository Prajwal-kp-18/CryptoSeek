#!/bin/bash
# Test script for refactored crypto analysis system

echo "====================================================================="
echo "Testing Refactored Crypto Analysis System"
echo "====================================================================="
echo ""

BINARY="${1:-../../test_firmware}"

if [ ! -f "$BINARY" ]; then
    echo "Error: Binary not found: $BINARY"
    echo "Usage: $0 [binary_path]"
    exit 1
fi

echo "[1/3] Collecting telemetry from binary: $BINARY"
echo "---------------------------------------------------------------------"

python3 verify_crypto_refactored.py "$BINARY" > telemetry_test.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Telemetry collection failed!"
    cat telemetry_test.json
    exit 1
fi

echo "✓ Telemetry collected successfully"
echo ""

echo "[2/3] Validating JSON output"
echo "---------------------------------------------------------------------"

jq '.' telemetry_test.json > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Invalid JSON output!"
    exit 1
fi

echo "✓ JSON is valid"
echo ""
echo "Telemetry summary:"
echo "  - Architecture: $(jq -r '.metadata.architecture' telemetry_test.json)"
echo "  - Total blocks: $(jq -r '.execution.total_blocks' telemetry_test.json)"
echo "  - Total instructions: $(jq -r '.execution.total_instructions' telemetry_test.json)"
echo "  - YARA detections: $(jq -r '.static_analysis.yara.detected | length' telemetry_test.json)"
echo "  - Constants found: $(jq -r '.static_analysis.constants | keys | length' telemetry_test.json)"
echo "  - Syscalls captured: $(jq -r '[.syscalls.getrandom, .syscalls.read_random, .syscalls.socket] | map(length) | add' telemetry_test.json)"
echo ""

echo "[3/3] Running LLM analyzer"
echo "---------------------------------------------------------------------"

python3 analyze_crypto_telemetry.py telemetry_test.json > report_test.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Analysis failed!"
    cat report_test.json
    exit 1
fi

echo "✓ Analysis completed successfully"
echo ""
echo "Classification results:"
echo "---------------------------------------------------------------------"
jq '.classification' report_test.json
echo ""

echo "====================================================================="
echo "Test completed successfully!"
echo "====================================================================="
echo ""
echo "Generated files:"
echo "  - telemetry_test.json (raw telemetry data)"
echo "  - report_test.json (analysis report)"
echo ""
echo "View full telemetry:"
echo "  jq '.' telemetry_test.json"
echo ""
echo "View full report:"
echo "  jq '.' report_test.json"
echo ""
