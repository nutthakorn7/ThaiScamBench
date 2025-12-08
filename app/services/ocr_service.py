"""
OCR Service using Google Cloud Vision API for fast and accurate text extraction.
Supports both Service Account credentials and API Key authentication.
"""
import os
import base64
import logging
import httpx
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

# Valid image extensions
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif", ".tiff"}

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
        
        # Option 1: Use API Key (same as Gemini API) - simplest approach
        cls._api_key = os.environ.get('GOOGLE_API_KEY')
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

    def extract_text(self, image_content: bytes) -> str:
        """
        Extract text from image bytes using Google Vision API.
        Uses API Key (REST) or Service Account based on configuration.
        """
        if self._use_rest_api and self._api_key:
            return self._extract_with_api_key(image_content)
        elif self._client:
            return self._extract_with_client(image_content)
        else:
            return self._mock_extract(image_content)
    
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
