"""
Thai Bank Slip Verification Utilities

Specialized verification for Thai bank transfer slips to detect fake/manipulated slips.
"""
import re
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

# Thai bank names and variations
THAI_BANKS = {
    "kbank": ["กสิกรไทย", "kbank", "kasikorn", "k-bank"],
    "scb": ["ไทยพาณิชย์", "scb", "siam commercial"],
    "bbl": ["กรุงเทพ", "bbl", "bangkok bank"],
    "ktb": ["กรุงไทย", "ktb", "krung thai"],
    "tmb": ["ทหารไทย", "ทหารไทยธนชาต", "tmb", "ttb", "tmbthanachart"],
    "bay": ["กรุงศรีอยุธยา", "bay", "krungsri"],
    "gsb": ["ออมสิน", "gsb", "government savings"],
    "baac": ["ธกส", "baac", "เพื่อการเกษตร"],
    "ghb": ["อาคารสงเคราะห์", "ghb"],
    "cimb": ["ซีไอเอ็มบี", "cimb"],
    "uob": ["ยูโอบี", "uob"],
    "tisco": ["ทิสโก้", "tisco"],
    "kk": ["เกียรตินาคิน", "kkp", "kiatnakin"],
    "lh": ["แลนด์ แอนด์ เฮ้าส์", "lh bank", "land and houses"]
}

# Common fake slip indicators
FAKE_SLIP_INDICATORS = [
    # Common watermark texts on fake slips
    "ตัวอย่าง", "sample", "demo", "test",
    # Photoshop artifacts
    "adobe", "photoshop", "canva",
    # Suspicious amounts (often used in scams)
    "999,999", "888,888", "777,777",
    # Template services
    "slipgenerator", "fakeslip", "ทำสลิป"
]


@dataclass
class SlipVerificationResult:
    """Result of bank slip verification."""
    is_likely_genuine: bool
    trust_score: float  # 0.0 - 1.0
    checks_passed: Dict[str, bool]
    detected_bank: Optional[str]
    detected_amount: Optional[str]
    detected_account: Optional[str]
    warnings: List[str]
    confidence: float  # How confident we are in this verification


def verify_thai_bank_slip(extracted_text: str) -> SlipVerificationResult:
    """
    Verify if extracted text appears to be from a genuine Thai bank slip.
    
    Args:
        extracted_text: OCR extracted text from image
        
    Returns:
        SlipVerificationResult with verification details
    """
    text_lower = extracted_text.lower()
    text_thai = extracted_text
    
    checks = {
        "has_valid_bank_name": False,
        "has_valid_account_format": False,
        "has_valid_amount_format": False,
        "has_valid_datetime": False,
        "has_ref_number": False,
        "no_fake_indicators": True
    }
    
    warnings = []
    detected_bank = None
    detected_amount = None
    detected_account = None
    
    # Check 1: Bank name detection
    for bank_code, bank_names in THAI_BANKS.items():
        for name in bank_names:
            if name in text_lower or name in text_thai:
                checks["has_valid_bank_name"] = True
                detected_bank = bank_code
                logger.debug(f"Detected bank: {bank_code}")
                break
        if detected_bank:
            break
    
    if not checks["has_valid_bank_name"]:
        warnings.append("ไม่พบชื่อธนาคารที่รู้จัก")
    
    # Check 2: Account number format (10-12 digits, may have dashes)
    account_patterns = [
        r'\d{3}-?\d{1}-?\d{5}-?\d{1}',  # XXX-X-XXXXX-X (common format)
        r'\d{10,12}',  # Simple 10-12 digits
    ]
    
    for pattern in account_patterns:
        match = re.search(pattern, extracted_text)
        if match:
            checks["has_valid_account_format"] = True
            detected_account = match.group(0)
            logger.debug(f"Detected account: {detected_account}")
            break
    
    if not checks["has_valid_account_format"]:
        warnings.append("ไม่พบเลขบัญชีที่ถูกต้อง")
    
    # Check 3: Amount format (Thai baht with comma)
    amount_patterns = [
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท|baht|thb)',  # With บาท
        r'(?:amount|จำนวน)[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # With label
        r'(\d{1,3}(?:,\d{3})*\.\d{2})'  # Simple format with decimals
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text_lower)
        if match:
            checks["has_valid_amount_format"] = True
            detected_amount = match.group(1) if match.groups() else match.group(0)
            logger.debug(f"Detected amount: {detected_amount}")
            break
    
    if not checks["has_valid_amount_format"]:
        warnings.append("ไม่พบจำนวนเงินที่ถูกต้อง")
    
    # Check 4: Date/time format
    datetime_patterns = [
        r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # DD/MM/YYYY or DD-MM-YYYY
        r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',  # YYYY/MM/DD
        r'\d{2}:\d{2}(?::\d{2})?',  # HH:MM or HH:MM:SS
    ]
    
    datetime_found = False
    for pattern in datetime_patterns:
        if re.search(pattern, extracted_text):
            datetime_found = True
            break
    
    checks["has_valid_datetime"] = datetime_found
    
    if not datetime_found:
        warnings.append("ไม่พบวันที่/เวลาที่ชัดเจน")
    
    # Check 5: Reference number (transaction ID)
    ref_patterns = [
        r'(?:ref|อ้างอิง|เลขที่)[:\s]*([A-Z0-9]{10,20})',
        r'[A-Z]{2}\d{10,}',  # Common format: AB1234567890
        r'\d{6,}-\d{4,}',  # Format: 123456-7890
    ]
    
    for pattern in ref_patterns:
        if re.search(pattern, extracted_text, re.IGNORECASE):
            checks["has_ref_number"] = True
            logger.debug("Found reference number")
            break
    
    if not checks["has_ref_number"]:
        warnings.append("ไม่พบเลขอ้างอิงธุรกรรม")
    
    # Check 6: Fake slip indicators
    for indicator in FAKE_SLIP_INDICATORS:
        if indicator in text_lower:
            checks["no_fake_indicators"] = False
            warnings.append(f"พบข้อความน่าสงสัย: {indicator}")
            logger.warning(f"Fake slip indicator detected: {indicator}")
            break
    
    # Calculate trust score
    passed_count = sum(1 for check in checks.values() if check)
    trust_score = passed_count / len(checks)
    
    # Determine if likely genuine (need at least 4/6 checks)
    is_likely_genuine = trust_score >= 0.65 and checks["no_fake_indicators"]
    
    # Confidence based on completeness of information
    confidence = min(trust_score + (0.2 if detected_bank else 0), 1.0)
    
    return SlipVerificationResult(
        is_likely_genuine=is_likely_genuine,
        trust_score=trust_score,
        checks_passed=checks,
        detected_bank=detected_bank,
        detected_amount=detected_amount,
        detected_account=detected_account,
        warnings=warnings,
        confidence=confidence
    )


def analyze_amount_anomalies(amount_str: Optional[str]) -> List[str]:
    """
    Analyze if the amount looks suspicious.
    
    Args:
        amount_str: Amount string (e.g., "999,999.00")
        
    Returns:
        List of anomaly warnings
    """
    if not amount_str:
        return []
    
    anomalies = []
    
    # Remove commas and parse
    try:
        amount_clean = amount_str.replace(',', '')
        amount = float(amount_clean)
        
        # Check for suspiciously round numbers
        if amount >= 10000 and amount % 10000 == 0:
            anomalies.append(f"จำนวนเงินเป็นตัวเลขกลมเกินไป: {amount_str}")
        
        # Check for common scam amounts
        suspicious_amounts = [999999, 888888, 777777, 666666, 555555]
        if int(amount) in suspicious_amounts:
            anomalies.append(f"จำนวนเงินเป็นรูปแบบที่พบบ่อยในสลิปปลอม: {amount_str}")
        
        # Check for unusually large amounts
        if amount > 1000000:  # > 1 million
            anomalies.append(f"จำนวนเงินสูงผิดปกติ: {amount_str} บาท")
        
        # Check for very small amounts (might be test transactions)
        if amount < 1:
            anomalies.append(f"จำนวนเงินต่ำผิดปกติ: {amount_str} บาท")
            
    except (ValueError, AttributeError):
        anomalies.append("รูปแบบจำนวนเงินไม่ถูกต้อง")
    
    return anomalies


def get_slip_verification_advice(result: SlipVerificationResult) -> str:
    """
    Generate advice based on slip verification result.
    
    Args:
        result: SlipVerificationResult
        
    Returns:
        Advice string in Thai
    """
    if not result.is_likely_genuine:
        if result.trust_score < 0.3:
            return (
                "🚨 สลิปนี้มีความน่าเชื่อถือต่ำมาก อาจเป็นสลิปปลอม "
                "ควรตรวจสอบกับธนาคารโดยตรง และอย่าเชื่อถือจนกว่าจะยืนยันแล้ว"
            )
        elif result.trust_score < 0.5:
            return (
                "⚠️ สลิปนี้ขาดข้อมูลสำคัญหลายอย่าง อาจถูกแก้ไขหรือปลอมแปลง "
                "ควรขอสลิปจริงจากธนาคารหรือตรวจสอบผ่าน Mobile Banking"
            )
        else:
            return (
                "⚠️ สลิปนี้มีข้อมูลไม่ครบถ้วนบางส่วน "
                "แนะนำให้ตรวจสอบเพิ่มเติมก่อนเชื่อถือ"
            )
    elif result.trust_score < 0.8:
        return (
            "✓ สลิปนี้มีรูปแบบคล้ายสลิปจริง แต่แนะนำให้ตรวจสอบยอดเงินจริง "
            "ผ่าน Mobile Banking หรือ Internet Banking เพื่อความมั่นใจ"
        )
    else:
        return (
            "✓ สลิปนี้มีรูปแบบสมบูรณ์และน่าเชื่อถือ "
            "แต่ควรตรวจสอบยอดเงินจริงในบัญชีเพื่อยืนยัน"
        )
