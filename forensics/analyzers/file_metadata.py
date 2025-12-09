"""
File & Metadata Analyzer

Extracts and analyzes file-level metadata and EXIF data to detect
AI-generated or manipulated images.
"""
import piexif
from PIL import Image
from PIL.ExifTags import TAGS
import io
import math
from typing import Dict, Optional, List
from collections import Counter


class FileMetadataAnalyzer:
    """Analyze file metadata and EXIF data"""
    
    # AI software signatures
    AI_SOFTWARE_SIGNATURES = [
        "stable diffusion", "stablediffusion", "sd",
        "midjourney", "dall-e", "dalle",
        "adobe firefly", "firefly",
        "leonardo.ai", "leonardo",
        "playground ai",
        "craiyon", "nightcafe"
    ]
    
    # Photo editing software
    EDITING_SOFTWARE = [
        "photoshop", "lightroom", "gimp",
        "affinity", "pixelmator", "snapseed",
        "facetune", "facetune2"
    ]
    
    def analyze(self, image_bytes: bytes) -> Dict:
        """
        Analyze file metadata
        
        Returns:
            dict with features and suspicious indicators
        """
        features = {}
        warnings = []
        
        # 1. EXIF Analysis
        exif_data = self._extract_exif(image_bytes)
        features["exif_exists"] = exif_data is not None
        
        if not exif_data:
            warnings.append("Missing EXIF - ไม่พบข้อมูลจำเพาะของภาพ (อาจเกิดจากการแคปหน้าจอหรือถูกลบข้อมูล)")
        
        # 2. Software Tag
        software = self._get_software_tag(exif_data)
        features["software_tag"] = software
        
        if software:
            software_lower = software.lower()
            
            # Check for AI software
            if any(ai in software_lower for ai in self.AI_SOFTWARE_SIGNATURES):
                warnings.append(f"AI Software Detected - ตรวจพบร่องรอยซอฟต์แวร์ AI ({software})")
                features["is_ai_generated"] = True
            
            # Check for editing software
            elif any(editor in software_lower for editor in self.EDITING_SOFTWARE):
                warnings.append(f"Editing Software - ตรวจพบโปรแกรมตัดต่อ ({software})")
                features["is_edited"] = True
        
        # 3. JPEG Type (baseline vs progressive)
        jpeg_info = self._analyze_jpeg_structure(image_bytes)
        features.update(jpeg_info)
        
        # 4. File Entropy
        entropy = self._calculate_entropy(image_bytes)
        features["file_entropy"] = entropy
        
        # Very high entropy can indicate encryption or heavy compression
        if entropy > 7.8:
            warnings.append(f"High Entropy ({entropy:.2f}) - ความซับซ้อนของข้อมูลสูงผิดปกติ (อาจเป็นภาพสังเคราะห์)")
        
        # 5. Creation/Modification Dates
        date_info = self._extract_dates(exif_data)
        features.update(date_info)
        
        # Check for timestamp anomalies
        if date_info.get("date_mismatch"):
            warnings.append("Date Mismatch - วันที่สร้างและแก้ไขไฟล์ไม่สัมพันธ์กัน")
        
        return {
            "features": features,
            "warnings": warnings,
            "score": self._calculate_score(features, warnings)
        }
    
    def _extract_exif(self, image_bytes: bytes) -> Optional[Dict]:
        """Extract EXIF data from image"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            exif_dict = piexif.load(image.info.get("exif", b""))
            
            # Convert to readable format
            exif_data = {}
            for ifd in ("0th", "Exif", "GPS", "1st"):
                if ifd in exif_dict:
                    for tag, value in exif_dict[ifd].items():
                        tag_name = piexif.TAGS[ifd][tag]["name"]
                        exif_data[tag_name] = value
            
            return exif_data if exif_data else None
        except:
            return None
    
    def _get_software_tag(self, exif_data: Optional[Dict]) -> Optional[str]:
        """Extract software tag from EXIF"""
        if not exif_data:
            return None
        
        # Check common software fields
        software_fields = ["Software", "ProcessingSoftware", "CreatorTool"]
        for field in software_fields:
            if field in exif_data:
                value = exif_data[field]
                if isinstance(value, bytes):
                    try:
                        return value.decode('utf-8', errors='ignore')
                    except:
                        pass
                return str(value)
        
        return None
    
    def _analyze_jpeg_structure(self, image_bytes: bytes) -> Dict:
        """Analyze JPEG encoding structure"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            if image.format != "JPEG":
                return {
                    "is_jpeg": False,
                    "jpeg_type": None
                }
            
            # Check if progressive
            is_progressive = image.info.get("progressive", False)
            
            return {
                "is_jpeg": True,
                "jpeg_type": "progressive" if is_progressive else "baseline"
            }
        except:
            return {"is_jpeg": False, "jpeg_type": None}
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate Shannon entropy of data"""
        if not data:
            return 0.0
        
        # Count byte frequencies
        counter = Counter(data)
        length = len(data)
        
        # Calculate entropy
        entropy = 0.0
        for count in counter.values():
            probability = count / length
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def _extract_dates(self, exif_data: Optional[Dict]) -> Dict:
        """Extract and analyze creation/modification dates"""
        if not exif_data:
            return {
                "has_datetime": False,
                "date_mismatch": False
            }
        
        # Extract dates
        datetime_original = exif_data.get("DateTimeOriginal")
        datetime_digitized = exif_data.get("DateTimeDigitized")
        datetime_modified = exif_data.get("DateTime")
        
        result = {
            "has_datetime": any([datetime_original, datetime_digitized, datetime_modified]),
            "datetime_original": datetime_original,
            "datetime_digitized": datetime_digitized,
            "datetime_modified": datetime_modified
        }
        
        # Check for mismatches (suspicious if dates are very different)
        dates = [d for d in [datetime_original, datetime_digitized, datetime_modified] if d]
        if len(set(dates)) > 1:
            result["date_mismatch"] = True
        
        return result
    
    def _calculate_score(self, features: Dict, warnings: List[str]) -> float:
        """
        Calculate suspicion score based on metadata analysis
        
        Returns:
            float between 0.0 (genuine) and 1.0 (suspicious)
        """
        score = 0.0
        
        # AI software detected = very suspicious
        if features.get("is_ai_generated"):
            score += 0.7
        
        # Editing software = moderately suspicious
        elif features.get("is_edited"):
            score += 0.3
        
        # Missing EXIF on photo (not screenshot) = suspicious
        if not features.get("exif_exists"):
            score += 0.2
        
        # High entropy = slightly suspicious
        if features.get("file_entropy", 0) > 7.8:
            score += 0.1
        
        # Date mismatch = slightly suspicious
        if features.get("date_mismatch"):
            score += 0.1
        
        return min(score, 1.0)
