import pytesseract
from PIL import Image
import io
import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class OCRAnalyzer:
    """
    Analyzer for extracting text from images using Tesseract OCR.
    Specializes in Thai bank slip extraction.
    """
    
    def __init__(self):
        self.bank_patterns = {
            "KBANK": [r"kbank", r"kasikorn", r"กสิกร"],
            "SCB": [r"scb", r"siam commercial", r"ไทยพาณิชย์"],
            "KTB": [r"ktb", r"krungthai", r"กรุงไทย"],
            "BBL": [r"bbl", r"bangkok bank", r"กรุงเทพ"],
            "GSB": [r"gsb", r"government savings", r"ออมสิน"],
            "TTB": [r"ttb", r"tmb", r"thanachart", r"ทหารไทย"],
            "BAY": [r"bay", r"krungsri", r"กรุงศรี"],
        }
        
    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Perform OCR on image bytes and extract structured data
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Perform OCR (Thai + English)
            # Use --psm 6 (Assume a single uniform block of text) for better slip reading
            text = pytesseract.image_to_string(image, lang='tha+eng', config='--psm 6')
            
            # Normalize text
            normalized_text = text.lower()
            
            # Extract Data
            bank = self._detect_bank(normalized_text)
            amount = self._detect_amount(normalized_text)
            
            logger.info(f"OCR Result - Bank: {bank}, Amount: {amount}")
            
            return {
                "raw_text": text.strip(),
                "extracted_data": {
                    "bank": bank,
                    "amount": amount,
                    "account_name": None # Hard to extract reliably without more context
                }
            }
            
        except Exception as e:
            logger.error(f"OCR failed: {str(e)}")
            return {
                "raw_text": "",
                "extracted_data": {
                    "bank": None,
                    "amount": None
                },
                "error": str(e)
            }
            
    def _detect_bank(self, text: str) -> str:
        for bank, patterns in self.bank_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    return bank
        return None
        
    def _detect_amount(self, text: str) -> str:
        # Regex for currency: 100.00, 1,000.00, 50.50
        # Look for patterns like "Amount 100.00", "xxx.xx Baht", or just numbers near keywords
        
        # Simple regex for amount format with 2 decimals
        # matches: 100.00, 1,500.25
        amount_pattern = r'[\d,]+\.\d{2}'
        matches = re.findall(amount_pattern, text)
        
        if matches:
            # Return the last match as it's often the total at bottom
            # or try to find one associated with "amount" or "bath"
            return matches[-1].replace(',', '')
            
        return None
