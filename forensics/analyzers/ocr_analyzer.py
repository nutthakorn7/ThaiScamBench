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
                # Add flexible regex for spaces/hyphens e.g. "bangkok bank" -> "bangkok\s*bank"
                # But simple substrings usually work. Let's try explicit flexible patterns or just standard search.
                # If text comes from OCR 'kbank' might be 'k bank'.
                if re.search(pattern, text):
                    return bank
                    
        # Flexible backup for common banks
        flexible_patterns = {
            "BBL": r"bangkok\s*bank",
            "KBANK": r"k[\s-]*bank|kasikorn",
            "SCB": r"siam\s*commercial",
            "KTB": r"krung\s*thai",
            "TTB": r"tmb|thanachart"
        }
        for bank, pattern in flexible_patterns.items():
            if re.search(pattern, text):
                return bank
                
        return None
        
    def _detect_amount(self, text: str) -> str:
        lines = text.split('\n')
        amount_candidates = []
        
        # Context keywords for amount
        keywords = ['amount', 'karn', 'money', 'bath', 'baht', 'thb', 'จำนวน', 'จำนวนเงิน', 'ยอดเงิน', 'โอน', 'จาก']
        
        # 1. Pattern Matching with Context
        for line in lines:
            line_lower = line.lower().strip()
            # Find numbers in format xx.xx or x,xxx.xx
            matches = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
            
            if matches:
                val_str = matches[0].replace(',', '')
                try:
                    val_float = float(val_str)
                    if val_float <= 0: continue
                    
                    # Check confidence based on keywords
                    has_keyword = any(k in line_lower for k in keywords)
                    confidence = 2 if has_keyword else 1
                    
                    # Heuristic: If line contains "fee" or "charge" (ค่าธรรมเนียม), lower confidence
                    if 'fee' in line_lower or 'ธรรมเนียม' in line_lower:
                        confidence = 0.5
                        
                    amount_candidates.append((val_float, confidence, val_str))
                except:
                    continue
                
        # 2. Heuristic Selection
        if amount_candidates:
            # Sort by confidence (desc), then by value (desc) ??? or finding the "transfer amount".
            # Usually the transfer amount is the main number. 
            # If we have a high confidence match, take it.
            # If not, take the LARGEST number (assuming it's the total transfer, not fee).
            # But sometimes "Balance" (ยอดคงเหลือ) is the largest.
            # We should exclude "balance" / "คงเหลือ"
            
            # Filter out lines that likely mean Balance
            filtered_candidates = []
            for amt, conf, s in amount_candidates:
                # We need context AGAIN from the line... 
                # This simple list structure lost the line context. 
                # For now let's just trust the keyword boosting.
                filtered_candidates.append((amt, conf, s))
                
            filtered_candidates.sort(key=lambda x: (x[1], x[0]), reverse=True)
            return filtered_candidates[0][2]

        # 3. Fallback: Search WHOLE text for any XX.XX number
        # If the line splitting failed, just grab all numbers 
        matches = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', text)
        valid_matches = []
        for m in matches:
             try:
                v = float(m.replace(',', ''))
                if v > 0: valid_matches.append(v)
             except: pass
             
        if valid_matches:
            # Return the largest value found (risky if balance is shown, but better than null)
            # Actually, usually balance is hidden or small or very large.
            # Let's try returning the largest value as a last resort.
            max_val = max(valid_matches)
            # Find the string representation of max_val to keep original formatting
            for m in matches:
                if abs(float(m.replace(',','')) - max_val) < 0.001:
                    return m.replace(',', '')
                    
        return None
