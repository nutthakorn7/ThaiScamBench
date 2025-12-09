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
    is_likely_genuine: bool
    trust_score: float
    detected_bank: Optional[str] = None
    detected_amount: Optional[str] = None
    checks_passed: int = 0
    total_checks: int = 6
    warnings: List[str] = None
    checks: List[str] = None
    advice: str = ""
    # New QR fields
    qr_data: Optional[str] = None
    qr_valid: bool = False

def scan_qr_code(image_content: bytes) -> Optional[str]:
    """
    Scan for QR code in image bytes using cv2/pyzbar.
    Returns decoded string if found.
    """
    
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
            
        # Try pyzbar first (robust)
        decoded_objects = decode(img)
        if decoded_objects:
            return decoded_objects[0].data.decode('utf-8')
            
        # Fallback to OpenCV detector
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(img)
        if data:
            return data
            
        return None
    except Exception as e:
        logger.warning(f"QR Scan failed: {e}")
        return None

def parse_promptpay_amount(qr_data: str) -> Optional[float]:
    """
    Extract amount from PromptPay QR Payload (EMVCo)
    Tag 54 is Transaction Amount.
    """
    try:
        if not qr_data or len(qr_data) < 20: 
            return None
        
        # Simple parser for checking Tag 54 (Amount)
        # Format: ID(2) Length(2) Value(L)
        i = 0
        while i < len(qr_data):
            tag = qr_data[i:i+2]
            if not tag.isdigit(): break
            length = int(qr_data[i+2:i+4])
            value = qr_data[i+4:i+4+length]
            
            if tag == "54": # Transaction Amount
                return float(value)
            
            i += 4 + length
            
        return None
    except Exception:
        return None

def verify_thai_bank_slip(ocr_text: str, image_bytes: Optional[bytes] = None) -> SlipVerificationResult:
    """
    Verify checks:
    1. Bank Name Detection
    2. Account Pattern
    3. Amount Format
    4. Date/Time Format
    5. Reference Number
    6. Fake Indicators (Negative)
    7. QR Code Validation (New!)
    """
    text_lower = ocr_text.lower()
    total_checks = 7 # Increased to 7
    checks_passed = 0
    warnings = []
    checks_list = []
    
    # 1. Bank Detection
    detected_bank = None
    for bank_code, keywords in THAI_BANKS.items():
        if any(kw in text_lower for kw in keywords):
            detected_bank = bank_code
            checks_passed += 1
            checks_list.append(f"Bank Found: {bank_code.upper()}")
            break
            
    if not detected_bank:
        warnings.append("ไม่พบชื่อธนาคารในสลิป")

    # 2. Account Pattern
    has_account = bool(re.search(r'\d{3}[-\s]?\d{1}[-\s]?\d{5}[-\s]?\d{1}', ocr_text) or
                      re.search(r'xxx-x-x\d{4}-x', text_lower))
    if has_account:
        checks_passed += 1
        checks_list.append("Account Pattern Valid")
    else:
        warnings.append("ไม่พบเลขบัญชีหรือรูปแบบไม่ถูกต้อง")

    # 3. Amount Format
    amounts = re.findall(r'[\d,]+\.\d{2}', ocr_text)
    detected_amount = amounts[0] if amounts else None
    if detected_amount:
        checks_passed += 1
        checks_list.append(f"Amount Found: {detected_amount}")
    else:
        warnings.append("ไม่พบจำนวนเงินที่ถูกต้อง")
    # Check 4: Date/Time Format
    datetime_patterns = [
        r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # DD/MM/YYYY or DD-MM-YYYY
        r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',  # YYYY/MM/DD
        r'\d{2}:\d{2}(?::\d{2})?',  # HH:MM or HH:MM:SS
        r'\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+\d{2,4}'
    ]
    
    has_datetime = False
    for pattern in datetime_patterns:
        if re.search(pattern, ocr_text):
            has_datetime = True
            break
            
    if has_datetime:
        checks_passed += 1
        checks_list.append("Date/Time Found")
    else:
        warnings.append("ไม่พบวันที่/เวลาที่ชัดเจน")

    # Check 5: Reference Number
    ref_patterns = [
        r'(?:ref|อ้างอิง|เลขที่)[:\s]*([A-Z0-9]{10,20})',
        r'[A-Z]{2}\d{10,}',  # Common format: AB1234567890
        r'\d{6,}-\d{4,}',  # Format: 123456-7890
    ]
    
    has_ref = False
    for pattern in ref_patterns:
        if re.search(pattern, ocr_text, re.IGNORECASE):
            has_ref = True
            break
            
    if has_ref:
        checks_passed += 1
        checks_list.append("Ref Number Found")
    else:
        warnings.append("ไม่พบเลขอ้างอิงธุรกรรม")
    
    # Check 6: Fake Indicators
    found_fake = [cw for cw in FAKE_SLIP_INDICATORS if cw in text_lower]
    if not found_fake:
        checks_passed += 1
        checks_list.append("No Fake Indicators")
    else:
        warnings.append(f"พบคำต้องสงสัย: {', '.join(found_fake)}")
        
    
    # 7. QR Code Validation (New!)
    qr_matches = False
    qr_decoded = None
    
    if image_bytes:
        qr_decoded = scan_qr_code(image_bytes)
        if qr_decoded:
            qr_amount = parse_promptpay_amount(qr_decoded)
            if qr_amount and detected_amount:
                try:
                    ocr_val = float(detected_amount.replace(',', ''))
                    if abs(qr_amount - ocr_val) < 0.01:
                        qr_matches = True
                        checks_passed += 1
                        checks_list.append("QR Code Amount Verified")
                    else:
                        warnings.append(f"QR ยอดเงิน ({qr_amount}) ไม่ตรงกับสลิป ({ocr_val})")
                except:
                    pass
            elif qr_decoded:
                # Found QR but couldn't verify amount (maybe URL or other format)
                # Still pass if standard checks passed
                checks_passed += 0.5 # Partial credit
                checks_list.append("QR Code Found")

    # Calculate Trust Score
    # Base score from passed checks (Max 7.5 possible with QR partial)
    # total_checks is 7
    trust_score = min(checks_passed / total_checks, 1.0)
    
    # Fake indicator penalty
    if found_fake:
        trust_score = 0.0
    
    # Critical QR Mismatch penalty
    if qr_decoded and detected_amount and not qr_matches and "QR ยอดเงิน" in "".join(warnings):
        trust_score = 0.0 # Instant fail if amounts verify but mismatch
    
    is_genuine = trust_score > 0.7

    result = SlipVerificationResult(
        is_likely_genuine=is_genuine,
        trust_score=trust_score,
        detected_bank=detected_bank,
        detected_amount=detected_amount,
        checks_passed=int(checks_passed), # Use int for display
        total_checks=total_checks,
        warnings=warnings,
        checks=checks_list,
        advice="", # Will be set below
        qr_data=qr_decoded if qr_decoded and len(qr_decoded) < 50 else ("Hidden data" if qr_decoded else None),
        qr_valid=qr_matches
    )
    
    # Generate advice based on the full result
    result.advice = get_slip_verification_advice(result)
    
    return result

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
