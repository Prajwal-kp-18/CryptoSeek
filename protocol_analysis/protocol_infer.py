import sys

def analyze_trace(filename):
    print(f"Analyzing {filename}...")
    try:
        with open(filename, 'rb') as f:
            data = f.read()
            if not data:
                print("  Empty trace.")
                return
            
            print(f"  Trace size: {len(data)} bytes")
            print(f"  First 50 bytes: {data[:50].hex()}")
            
            # Simple heuristic for TLS Record (ContentType 0x16 = Handshake)
            # TLS Record: [ContentType:1] [Version:2] [Length:2] ...
            if len(data) >= 5 and data[0] == 0x16:
                version = (data[1] << 8) | data[2]
                length = (data[3] << 8) | data[4]
                print(f"  [+] Detected TLS Handshake Record")
                print(f"      Version: 0x{version:04x}")
                print(f"      Length: {length}")
            else:
                print("  [-] No obvious TLS record at start")
    except FileNotFoundError:
        print(f"  File not found: {filename}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 protocol_infer.py <trace1> [trace2 ...]")
        sys.exit(1)
    
    for arg in sys.argv[1:]:
        analyze_trace(arg)
