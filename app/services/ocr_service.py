import easyocr
import numpy as np
import cv2
from fastapi import UploadFile
import logging

# Configure logging
logger = logging.getLogger(__name__)

class OCRService:
    _instance = None
    _reader = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCRService, cls).__new__(cls)
            logger.info("Initializing EasyOCR Model (Thai + English)...")
            # Initialize Reader with Thai ('th') and English ('en')
            # gpu=False for server compatibility (as discussed), set True if local GPU available
            cls._reader = easyocr.Reader(['th', 'en'], gpu=False) 
            logger.info("EasyOCR Model Initialized Successfully.")
        return cls._instance

    def extract_text(self, image_content: bytes) -> str:
        """
        Extract text from image bytes.
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_content, np.uint8)
            
            # Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Could not decode image")

            # Perform prediction
            # detail=0 returns only the text content
            result = self._reader.readtext(img, detail=0, paragraph=True)
            
            # Join text segments
            extracted_text = " ".join(result)
            
            logger.info(f"OCR Extraction complete. Length: {len(extracted_text)}")
            return extracted_text

        except Exception as e:
            logger.error(f"OCR Failed: {str(e)}")
            raise e

# Valid image extensions
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def validate_image_extension(filename: str) -> bool:
    if not filename:
        return False
    return any(filename.lower().endswith(ext) for ext in VALID_IMAGE_EXTENSIONS)
