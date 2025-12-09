"""
JPEG Forensics Analyzer

Analyzes JPEG compression artifacts to detect manipulation,
double compression, and non-standard quantization tables.
"""
import numpy as np
from PIL import Image
import io
import struct
from typing import Dict, List, Optional, Tuple
import math

class JpegForensicsAnalyzer:
    """Analyze JPEG specific artifacts"""
    
    # Standard Photoshop Quantization Table Hashes (MD5-like or approximate)
    # This is a simplified list. Real systems use a large database.
    PHOTOSHOP_QT_HASHES = [
        # Common Photoshop Save for Web qualities
        "photoshop_60", "photoshop_80", "photoshop_100" 
    ]
    
    def analyze(self, image_bytes: bytes) -> Dict:
        """
        Analyze JPEG structure and artifacts
        
        Returns:
            dict with features and suspicious indicators
        """
        features = {}
        warnings = []
        scores = {}
        
        # 1. Basic JPEG Structure Check
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.format != "JPEG":
                return {
                    "is_jpeg": False,
                    "warnings": [],
                    "score": 0.0
                }
        except:
             return {"is_jpeg": False, "warnings": ["invalid_image"], "score": 0.0}

        features["is_jpeg"] = True
        
        # 2. Extract Quantization Tables
        q_tables = self._extract_quantization_tables(image_bytes)
        features["quantization_tables_count"] = len(q_tables)
        
        # 3. Analyze Quantization Tables
        qt_analysis = self._analyze_qt(q_tables)
        features.update(qt_analysis)
        
        if qt_analysis.get("is_photoshop_qt"):
            warnings.append("photoshop_quantization_table")
            scores["qt"] = 0.4
        elif qt_analysis.get("is_non_standard_qt"):
            warnings.append("non_standard_quantization")
            scores["qt"] = 0.2
            
        # 4. Estimate Quality
        quality = self._estimate_quality(q_tables)
        features["estimated_quality"] = quality
        
        # 5. Double Compression Detection (Simplified)
        # Note: True double compression requires DCT coefficient histogram analysis
        # which is complex. We'll use a heuristic based on file structure markers here.
        double_comp_score = self._detect_double_compression_heuristic(image_bytes)
        features["double_compression_score"] = double_comp_score
        
        if double_comp_score > 0.6:
            warnings.append("possible_double_compression")
            scores["double_comp"] = double_comp_score
            
        return {
            "features": features,
            "warnings": warnings,
            "score": max(scores.values()) if scores else 0.0
        }

    def _extract_quantization_tables(self, data: bytes) -> List[List[int]]:
        """Extract DQT segments from JPEG binary"""
        q_tables = []
        i = 0
        while i < len(data) - 1:
            if data[i] == 0xFF:
                marker = data[i+1]
                if marker == 0xD8: # SOI
                    i += 2
                elif marker == 0xD9: # EOI
                    break
                elif marker == 0xDB: # DQT
                    length = data[i+2] * 256 + data[i+3]
                    # DQT payload starts at i+4
                    # Length includes the 2 bytes for length
                    payload = data[i+4 : i+2+length]
                    
                    # Parse tables in this segment
                    pos = 0
                    while pos < len(payload):
                        # Precision (4 bits) and ID (4 bits)
                        info = payload[pos]
                        precision = info >> 4
                        t_id = info & 0x0F
                        pos += 1
                        
                        # 8-bit precision = 64 bytes, 16-bit = 128 bytes
                        if precision == 0:
                            table_size = 64
                        else:
                            table_size = 128
                            
                        if pos + table_size <= len(payload):
                            table = list(payload[pos : pos + table_size])
                            q_tables.append(table)
                            pos += table_size
                        else:
                            break
                    i += 2 + length
                else:
                    # Skip other markers
                    if i+3 < len(data):
                         length = data[i+2] * 256 + data[i+3]
                         i += 2 + length
                    else:
                        break
            else:
                i += 1
        return q_tables

    def _analyze_qt(self, q_tables: List[List[int]]) -> Dict:
        """Analyze quantization tables for known signatures"""
        if not q_tables:
            return {"has_qt": False}
        
        # Simplistic check if standard (usually starts with low numbers)
        # Real cameras often have specific standard tables
        
        # Check first table (Luminance)
        lum_table = q_tables[0]
        
        # Photoshop signatures often have specific patterns
        # This is a placeholder logic. In production, we compare against a DB.
        is_photoshop = False
        
        # Heuristic: Check for flat tables (synthetic) or specific patterns
        # Example: All 1s (100% quality)
        is_100_quality = all(x == 1 for x in lum_table)
        
        return {
            "has_qt": True,
            "lum_table_hash": hash(tuple(lum_table)),
            "is_100_quality": is_100_quality,
            "is_photoshop_qt": is_photoshop, # Would need DB lookup
            "is_non_standard_qt": False # Would need Camera DB lookup
        }

    def _estimate_quality(self, q_tables: List[List[int]]) -> int:
        """Estimate JPEG quality factor from Quantization Tables"""
        if not q_tables:
            return 0
            
        # Based on standard luminance table (simplified)
        # Using first element (DC coefficient quantization) as rough proxy
        # Standard: 16 at Q50
        
        if len(q_tables[0]) < 1:
            return 0
            
        val = q_tables[0][0] # DC quantizer
        
        if val == 1: return 100
        if val <= 2: return 95
        if val <= 3: return 90
        if val <= 8: return 80
        if val <= 16: return 50
        return 30 # Rough estimate
        
    def _detect_double_compression_heuristic(self, data: bytes) -> float:
        """
        Detect double compression using heuristic markers.
        Real detection requires analyzing DCT histograms.
        """
        # Placeholder for complex DCT analysis
        # For now, we return 0.0 to avoid false positives without the heavy math libs
        # This will be implemented fully in Phase 3/4 or with more time
        return 0.0
