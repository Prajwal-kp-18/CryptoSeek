"""
Crypto String Detection Service
Extracts cryptographic and protocol-related strings from binaries
"""

import os
import subprocess
import re
from typing import Dict, Any, List
from config.logging_config import logger
from services.llm_crypto_analyzer import llm_crypto_analyzer

try:
    from services.llm_crypto_analyzer import llm_crypto_analyzer
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    llm_crypto_analyzer = None


class CryptoStringDetector:
    """Service for detecting cryptographic strings in binaries"""
    
    # Comprehensive regex pattern for crypto and protocol strings
    CRYPTO_PATTERN = r'(AES|CHACHA|POLY1305|HMAC|SHA[0-9-]|SHA3|BLAKE2|PBKDF2|HKDF|KDF|NONCE|TAG |GMAC|GCM|CCM|CBC|XTS|RSA|ECDSA|ECDH|ED25519|X25519|secp256|Curve25519|PKCS#?(1|5|7|8|10|11|12)|Private Key|Public Key|X509|Certificate|OCSP|CRL|CAfile|CApath|/etc/(ssl|pki)|TLSv1(\.[0-3])?|TLSv1_[123]|DTLSv1(_2)?|ClientHello|ServerHello|NewSessionTicket|Certificate(Request|Verify)?|Finished|ChangeCipherSpec|KeyUpdate|ALPN|0-RTT|pre-shared key|Cipher.?suite|Master Secret|wolfSSL|OpenSSL|LibreSSL|BoringSSL|mbedTLS|GnuTLS|libsodium|libcrypto\.so|libssl\.so|HTTP/1\.1|HTTP/2|GET /|POST /|User-Agent:|Authorization:|MQTT|CoAP|websocket|grpc-status|Modbus|DNP3|IEC104|BACnet|OPC UA|opc\.tcp://|JWT|OAuth|OpenID|access_token|refresh_token|HS256|RS256|ES256|SSLKEYLOG|client_random)'
    
    def __init__(self):
        """Initialize the crypto string detector"""
        self.pattern = re.compile(self.CRYPTO_PATTERN, re.IGNORECASE)
    
    def extract_crypto_strings(self, binary_path: str, job_id: str = None, file_type: str = "unknown", use_llm: bool = True) -> Dict[str, Any]:
        """
        Extract cryptographic and protocol-related strings from a binary
        
        Args:
            binary_path: Path to the binary file
            job_id: Optional job ID for logging
            file_type: Type of file being analyzed
            use_llm: Whether to use LLM for intelligent analysis
            
        Returns:
            Dict containing categorized crypto strings, statistics, and LLM analysis
        """
        log_prefix = f"JobID: {job_id} - " if job_id else ""
        logger.info(f"{log_prefix}Extracting crypto strings from: {binary_path}")
        
        if not os.path.exists(binary_path):
            logger.error(f"{log_prefix}Binary not found: {binary_path}")
            return {
                "status": "error",
                "error": "Binary file not found",
                "crypto_detected": False
            }
        
        try:
            # Run strings command with minimum length of 4 characters
            result = subprocess.run(
                ["strings", "-n", "4", binary_path],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                logger.warning(f"{log_prefix}strings command failed: {result.stderr}")
                return {
                    "status": "error",
                    "error": f"strings command failed: {result.stderr}",
                    "crypto_detected": False
                }
            
            all_strings = result.stdout.strip().split('\n')
            logger.info(f"{log_prefix}Extracted {len(all_strings)} strings from binary")
            
            # Filter strings matching crypto patterns
            crypto_strings = []
            for s in all_strings:
                if self.pattern.search(s):
                    crypto_strings.append(s)
            
            logger.info(f"{log_prefix}Found {len(crypto_strings)} crypto-related strings")
            
            # Categorize the findings
            categorized = self._categorize_strings(crypto_strings)
            
            # Generate summary
            summary = self._generate_summary(categorized)
            
            result = {
                "status": "success",
                "crypto_detected": len(crypto_strings) > 0,
                "total_strings": len(all_strings),
                "crypto_strings_count": len(crypto_strings),
                "crypto_strings": crypto_strings[:100],  # Limit to first 100
                "categories": categorized,
                "summary": summary
            }
            
            # Add LLM analysis if requested and crypto strings were found
            if use_llm and crypto_strings:
                binary_name = os.path.basename(binary_path)
                llm_analysis = llm_crypto_analyzer.analyze_crypto_strings(
                    crypto_strings, 
                    binary_name,
                    file_type=file_type,
                    job_id=job_id
                )
                result["llm_analysis"] = llm_analysis
                
                # Log verdict if available
                if llm_analysis.get("status") == "success":
                    verdict = llm_analysis.get("verdict", {}).get("summary", "N/A")
            elif use_llm:
                result["llm_analysis"] = {
                    "status": "skipped",
                    "reason": "No crypto strings detected"
                }
            
            logger.info(f"{log_prefix}Crypto string detection complete - Found: {len(crypto_strings)} matches")
            return result
            
        except subprocess.TimeoutExpired:
            logger.error(f"{log_prefix}strings command timeout")
            return {
                "status": "error",
                "error": "String extraction timed out",
                "crypto_detected": False
            }
        except Exception as e:
            logger.error(f"{log_prefix}Crypto string extraction error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "crypto_detected": False
            }
    
    def _categorize_strings(self, strings: List[str]) -> Dict[str, List[str]]:
        """Categorize crypto strings by type"""
        categories = {
            "symmetric_crypto": [],
            "asymmetric_crypto": [],
            "hashing": [],
            "tls_ssl": [],
            "crypto_libraries": [],
            "protocols": [],
            "tokens_auth": [],
            "iot_protocols": [],
            "other": []
        }
        
        # Pattern definitions for each category
        patterns = {
            "symmetric_crypto": r'(AES|CHACHA|POLY1305|GCM|CCM|CBC|XTS|GMAC|NONCE)',
            "asymmetric_crypto": r'(RSA|ECDSA|ECDH|ED25519|X25519|secp256|Curve25519|PKCS|Private Key|Public Key)',
            "hashing": r'(HMAC|SHA[0-9-]|SHA3|BLAKE2|PBKDF2|HKDF|KDF)',
            "tls_ssl": r'(TLSv1|DTLSv1|ClientHello|ServerHello|NewSessionTicket|Certificate|ChangeCipherSpec|KeyUpdate|ALPN|0-RTT|pre-shared key|Cipher.?suite|Master Secret|X509|OCSP|CRL|CAfile|CApath|/etc/(ssl|pki)|SSLKEYLOG)',
            "crypto_libraries": r'(wolfSSL|OpenSSL|LibreSSL|BoringSSL|mbedTLS|GnuTLS|libsodium|libcrypto\.so|libssl\.so)',
            "protocols": r'(HTTP/1\.1|HTTP/2|GET /|POST /|User-Agent:|Authorization:|websocket|grpc-status)',
            "tokens_auth": r'(JWT|OAuth|OpenID|access_token|refresh_token|HS256|RS256|ES256)',
            "iot_protocols": r'(MQTT|CoAP|Modbus|DNP3|IEC104|BACnet|OPC UA|opc\.tcp://)'
        }
        
        for string in strings:
            categorized = False
            for category, pattern in patterns.items():
                if re.search(pattern, string, re.IGNORECASE):
                    if string not in categories[category]:  # Avoid duplicates
                        categories[category].append(string)
                    categorized = True
            
            if not categorized:
                categories["other"].append(string)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}
    
    def _generate_summary(self, categorized: Dict[str, List[str]]) -> Dict[str, Any]:
        """Generate a summary of findings"""
        summary = {
            "total_categories": len(categorized),
            "category_counts": {cat: len(items) for cat, items in categorized.items()},
            "key_findings": []
        }
        
        # Generate key findings
        if "crypto_libraries" in categorized:
            libs = categorized["crypto_libraries"]
            summary["key_findings"].append(f"Detected crypto libraries: {', '.join(set([self._extract_lib_name(s) for s in libs]))}")
        
        if "symmetric_crypto" in categorized:
            summary["key_findings"].append(f"Symmetric crypto algorithms found: {len(categorized['symmetric_crypto'])} references")
        
        if "asymmetric_crypto" in categorized:
            summary["key_findings"].append(f"Asymmetric crypto algorithms found: {len(categorized['asymmetric_crypto'])} references")
        
        if "tls_ssl" in categorized:
            summary["key_findings"].append(f"TLS/SSL implementation detected: {len(categorized['tls_ssl'])} references")
        
        if "iot_protocols" in categorized:
            summary["key_findings"].append(f"IoT protocols detected: {', '.join(set([self._extract_protocol_name(s) for s in categorized['iot_protocols']]))}")
        
        return summary
    
    def _extract_lib_name(self, string: str) -> str:
        """Extract library name from string"""
        libs = ["wolfSSL", "OpenSSL", "LibreSSL", "BoringSSL", "mbedTLS", "GnuTLS", "libsodium"]
        for lib in libs:
            if lib.lower() in string.lower():
                return lib
        return "Unknown"
    
    def _extract_protocol_name(self, string: str) -> str:
        """Extract protocol name from string"""
        protocols = ["MQTT", "CoAP", "Modbus", "DNP3", "IEC104", "BACnet", "OPC UA"]
        for proto in protocols:
            if proto.lower() in string.lower():
                return proto
        return "Unknown"


# Singleton instance
crypto_string_detector = CryptoStringDetector()
