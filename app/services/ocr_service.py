"""
OCR Service using Google Cloud Vision API for fast and accurate text extraction.
Supports both Service Account credentials and API Key authentication.
"""
import os
import base64
import logging
import httpx
import numpy as np
import cv2
from pyzbar.pyzbar import decode
from typing import Optional
from app.utils.image_preprocessing import preprocess_for_ocr, get_preprocessing_stats

# Configure logging
logger = logging.getLogger(__name__)

# Valid image extensions
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif", ".tiff"}

# Lazy import of vision analyzer to avoid circular dependency
_vision_analyzer = None

def get_vision_analyzer():
    global _vision_analyzer
    if _vision_analyzer is None:
        try:
            from app.services.impl.gemini_vision_analyzer import get_vision_analyzer as _get_analyzer
            _vision_analyzer = _get_analyzer()
            logger.info("✅ Gemini Vision Analyzer loaded")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load Vision Analyzer: {e}")
            _vision_analyzer = None
    return _vision_analyzer

def validate_image_extension(filename: str) -> bool:
    if not filename:
        return False
    return any(filename.lower().endswith(ext) for ext in VALID_IMAGE_EXTENSIONS)


class OCRService:
    """OCR Service using Google Cloud Vision API with API Key support."""
    
    _instance = None
    _api_key = None
    _client = None
    _use_rest_api = False
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCRService, cls).__new__(cls)
            cls._initialize_client()
        return cls._instance

    @classmethod
    def _initialize_client(cls):
        """Initialize Google Vision client - prioritize API Key for simplicity."""
        if cls._initialized:
            return
        
        # Option 1: Use Vision-specific API Key first, then fall back to shared key
        cls._api_key = os.environ.get('GOOGLE_VISION_API_KEY') or os.environ.get('GOOGLE_API_KEY')
        if cls._api_key:
            cls._use_rest_api = True
            logger.info("✅ Google Vision API initialized with API Key (REST API)")
            cls._initialized = True
            return
            
        # Option 2: Use Service Account credentials file
        try:
            from google.cloud import vision
            
            credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            
            if credentials_path and os.path.exists(credentials_path):
                cls._client = vision.ImageAnnotatorClient()
                logger.info("✅ Google Vision API initialized with Service Account")
            elif os.environ.get('GOOGLE_CLOUD_PROJECT'):
                cls._client = vision.ImageAnnotatorClient()
                logger.info("✅ Google Vision API initialized with default credentials")
            else:
                logger.warning("⚠️ No Google credentials found, using mock OCR")
                cls._client = None
                
        except ImportError:
            logger.warning("⚠️ google-cloud-vision not installed, using mock OCR")
            cls._client = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Vision API: {e}")
            cls._client = None
            
        cls._initialized = True

    def extract_text(self, image_content: bytes, use_preprocessing: bool = True) -> str:
        """
        Extract text from image bytes using Google Vision API.
        Also detects QR codes natively.
        Uses API Key (REST) or Service Account based on configuration.
        
        Args:
            image_content: Raw image bytes
            use_preprocessing: Whether to apply image preprocessing for better OCR (default: True)
        
        DEPRECATED: Use extract_text_and_analyze() for vision analysis.
        """
        # 0. Optional preprocessing for better OCR accuracy
        processed_content = image_content
        if use_preprocessing:
            try:
                processed_content = preprocess_for_ocr(image_content)
                logger.debug("✨ Applied image preprocessing for OCR")
            except Exception as e:
                logger.warning(f"Preprocessing failed, using original: {e}")
                processed_content = image_content
        
        # 1. Detect QR Codes first (Local operation)
        qr_text = self._detect_qr_code(processed_content)
        
        # 2. Extract OCR Text (Cloud operation)
        ocr_text = ""
        if self._use_rest_api and self._api_key:
            ocr_text = self._extract_with_api_key(processed_content)
        elif self._client:
            ocr_text = self._extract_with_client(processed_content)
        else:
            ocr_text = self._mock_extract(processed_content)
            
        # Combine results
        full_text = f"{ocr_text}\n{qr_text}".strip()
        return full_text
    
    async def extract_text_and_analyze(self, image_content: bytes, use_preprocessing: bool = True) -> dict:
        """
        Extract text AND perform visual forensics analysis.
        
        Args:
            image_content: Raw image bytes
            use_preprocessing: Whether to apply image preprocessing for better OCR (default: True)
        
        Returns:
            dict with:
                - text: str (OCR + QR combined)
                - visual_analysis: VisualAnalysisResult (or None if disabled)
                - preprocessing_applied: bool
        """
        # 1-2. Standard text extraction (OCR + QR) with optional preprocessing
        text = self.extract_text(image_content, use_preprocessing=use_preprocessing)
        
        # 3. Visual Forensics (Gemini Vision)
        vision_analyzer = get_vision_analyzer()
        visual_analysis = None
        
        if vision_analyzer:
            try:
                visual_analysis = await vision_analyzer.analyze_image(image_content)
                logger.info(f"🔍 Visual analysis complete: risk={visual_analysis.visual_risk_score:.2f}")
            except Exception as e:
                logger.error(f"Vision analysis failed: {e}")
                visual_analysis = None
        
        return {
            "text": text,
            "visual_analysis": visual_analysis,
            "preprocessing_applied": use_preprocessing
        }

    def _detect_qr_code(self, image_content: bytes) -> str:
        """
        Detect and decode QR codes from image bytes.
        Returns formatted string of detected URLs/Data.
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_content, np.uint8)
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if image is None:
                return ""

            # Detect QR codes
            decoded_objects = decode(image)
            
            results = []
            for obj in decoded_objects:
                data = obj.data.decode("utf-8")
                results.append(f"[QR CODE FOUND: {data}]")
                logger.info(f"🔍 QR Code Detected: {data}")
            
            if results:
                return "\n" + "\n".join(results)
            return ""
            
        except Exception as e:
            logger.warning(f"⚠️ QR Detection failed: {e}")
            return ""
    
    def _extract_with_api_key(self, image_content: bytes) -> str:
        """Extract text using Vision API with API Key (REST API)."""
        try:
            # Encode image to base64
            image_base64 = base64.b64encode(image_content).decode('utf-8')
            
            # Vision API endpoint
            url = f"https://vision.googleapis.com/v1/images:annotate?key={self._api_key}"
            
            # Request payload
            payload = {
                "requests": [{
                    "image": {
                        "content": image_base64
                    },
                    "features": [{
                        "type": "TEXT_DETECTION",
                        "maxResults": 1
                    }],
                    "imageContext": {
                        "languageHints": ["th", "en"]
                    }
                }]
            }
            
            # Make request
            with httpx.Client(timeout=60.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
            
            # Parse response
            if "responses" in result and result["responses"]:
                annotations = result["responses"][0].get("textAnnotations", [])
                if annotations:
                    extracted_text = annotations[0].get("description", "")
                    logger.info(f"✅ Vision API (REST) OCR complete. Length: {len(extracted_text)}")
                    return extracted_text
                else:
                    logger.info("ℹ️ No text detected in image")
                    return ""
            
            # Check for errors
            if "responses" in result and result["responses"]:
                error = result["responses"][0].get("error")
                if error:
                    raise Exception(f"Vision API error: {error.get('message', 'Unknown error')}")
            
            return ""
            
        except Exception as e:
            logger.error(f"❌ Vision API (REST) OCR failed: {e}")
            return self._mock_extract(image_content)
    
    def _extract_with_client(self, image_content: bytes) -> str:
        """Extract text using Vision API with Service Account client."""
        try:
            from google.cloud import vision
            
            image = vision.Image(content=image_content)
            image_context = vision.ImageContext(language_hints=['th', 'en'])
            
            response = self._client.text_detection(
                image=image,
                image_context=image_context
            )
            
            if response.error.message:
                raise Exception(f"Vision API error: {response.error.message}")
            
            texts = response.text_annotations
            if texts:
                extracted_text = texts[0].description
                logger.info(f"✅ Vision API (Client) OCR complete. Length: {len(extracted_text)}")
                return extracted_text
            else:
                logger.info("ℹ️ No text detected in image")
                return ""
                
        except Exception as e:
            logger.error(f"❌ Vision API (Client) OCR failed: {e}")
            return self._mock_extract(image_content)
    
    def _mock_extract(self, image_content: bytes) -> str:
        """Mock text extraction when Vision API is not available."""
        logger.warning("Using mock OCR - Google Vision API not configured")
        return "[OCR ไม่พร้อมใช้งาน - กรุณาตั้งค่า GOOGLE_API_KEY]"


# Dependency injection helper
def get_ocr_service() -> OCRService:
    """Get OCR service instance for FastAPI dependency injection."""
    return OCRService()
