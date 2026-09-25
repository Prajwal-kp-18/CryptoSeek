#!/bin/bash
echo "=== ARM TLS Demo ==="
(cd tls_demo_arm && ./run_pipeline_arm.sh)
echo "=== MIPS TLS Demo ==="
(cd tls_demo_mips && ./run_pipeline_mips.sh)
echo "=== Protocol Analysis ==="
python3 protocol_infer.py tls_demo_arm/qemu_arm.log tls_demo_mips/qemu_mips.log
echo "SUCCESS: Pipeline execution complete"
