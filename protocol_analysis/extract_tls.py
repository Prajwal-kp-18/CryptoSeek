#!/usr/bin/env python3
import sys

if len(sys.argv) < 2:
    print("Usage: python3 extract_tls.py <log_file>")
    sys.exit(1)

log_file = sys.argv[1]

try:
    with open(log_file, 'rb') as f:
        data = f.read()

    # Find TLS handshake (0x16 0x03 0x03)
    # 0x16 = Handshake
    # 0x03 0x03 = TLS 1.2
    tls_pos = data.find(b'\x16\x03\x03')
    
    if tls_pos != -1:
        # Extract 50 bytes or as much as available
        tls_record = data[tls_pos:tls_pos+50]
        print(f"✅ TLS ClientHello FOUND in {log_file}!")
        print("Raw bytes:", tls_record.hex(' '))
        
        if len(tls_record) >= 5:
            length = int.from_bytes(tls_record[3:5], byteorder='big')
            print(f"Decoded: ContentType=22(Handshake), Version=0x0303, Length={length}")
    else:
        print(f"[-] No TLS record found in {log_file} - check hexdump")
        sys.exit(1)

except FileNotFoundError:
    print(f"Error: File {log_file} not found")
    sys.exit(1)
