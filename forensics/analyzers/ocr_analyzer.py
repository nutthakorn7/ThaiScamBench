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
        # Check simple patterns first
        for bank, patterns in self.bank_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    return bank
        
        # Add logo/color detection logic here in future if needed
        return None
        
    def _detect_amount(self, text: str) -> str:
        lines = text.split('\n')
        amount_candidates = []
        
        # Context keywords for amount
        keywords = ['amount', 'karn', 'money', 'bath', 'baht', 'thb', 'จำนวน', 'จำนวนเงิน', 'ยอดเงิน', 'โอน', 'จาก']
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # 1. Find numbers in format xx.xx or x,xxx.xx
            # Regex for amounts like 100.00, 1,000.00
            matches = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
            
            if matches:
                val = matches[0].replace(',', '')
                # Filter out likely dates/times (e.g. 2023.01, 14.30) if they are not near amount keywords
                # But typically dates use / or - or :
                
                # Check if this line also has a keyword
                has_keyword = any(k in line_lower for k in keywords)
                
                # Assign confidence
                confidence = 2 if has_keyword else 1
                amount_candidates.append((float(val), confidence, val))
                
        if not amount_candidates:
            # Fallback: simple search in full text if line splitting failed
            matches = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', text)
            if matches:
                # Return logical max (often total) or last found?
                # Usually transfer amount is prominent. Let's take specific logic.
                # Assuming valid amounts > 0
                valid = [m for m in matches if float(m.replace(',','')) > 0]
                if valid:
                    # Heuristic: The transfer amount is often not the largest (balance) but is significant
                    # For now return the one found last (often 'Amount: xxx')
                    return valid[-1].replace(',', '')
                    
            return None
            
        # Sort candidates by confidence (desc) then by value?
        # Usually we want the explicitly labeled amount.
        amount_candidates.sort(key=lambda x: x[1], reverse=True)
        
        # Return best candidate string
        return amount_candidates[0][2]
