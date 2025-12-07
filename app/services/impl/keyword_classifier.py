"""
Keyword-based Scam Classifier Implementation

Rule-based classifier using Thai keyword patterns.
Fast inference (< 5ms) with ~65% accuracy.
"""
from typing import Tuple
import logging

from app.services.interfaces.classifier import IScamClassifier, ClassificationResult
from app.core.exceptions import ValidationError, ModelError

logger = logging.getLogger(__name__)


# Enhanced scam category keyword patterns
SCAM_PATTERNS = {
    "parcel_scam": [
        "พัสดุ", "ค้างชำระ", "ค่าธรรมเนียม", "ค่าจัดส่ง", "Kerry", "Flash", 
        "DHL", "FedEx", "EMS", "ไปรษณีย์", "Thailand Post", "ขนส่ง", "ส่งของ",
        "กัก", "ถูกกัก", "ค้างศุลกากร", "ยืนยันที่อยู่", "COD", "เก็บเงินปลายทาง"
    ],
    "banking_scam": [
        "ธนาคาร", "บัตรเครดิต", "บัญชี", "ATM", "โอนเงิน", "ระงับบัญชี",
        "OTP", "รหัส", "ยืนยันตัวตน", "ผิดปกติ", "ตรวจพบ", "กรุงเทพ",
        "ไทยพาณิชย์", "กสิกร", "กรุงศรี", "ทหารไทย", "LINE Banking"
    ],
    "prize_scam": [
        "รางวัล", "ถูกรางวัล", "โชคดี", "ชนะ", "แจ็คพอต", "ยินดีด้วย",
        "คุณได้รับ", "โบนัส", "ฟรี", "ชิงโชค", "voucher", "คูปอง"
    ],
    "investment_scam": [
        "ลงทุน", "กำไร", "ผลตอบแทน", "รับประกัน", "forex", "crypto", 
        "คริปโต", "bitcoin", "เหรียญ", "รวยเร็ว", "ลงทุนน้อย", "หุ้น",
        "แชร์ลูกโซ่", "MLM", "ขายตรง", "% ต่อเดือน", "รายได้เสริม"
    ],
    "impersonation_scam": [
        "ตำรวจ", "DSI", "สำนักงานป้องกัน", "ปปส", "กรมสรรพากร",
        "หมายจับ", "คดีความ", "ผิดกฎหมาย", "กิจกรรมผิดกฎหมาย",
        "คดีอาญา", "ฟ้องร้อง", "อัยการ", "ศาล", "เจ้าหน้าที่"
    ],
    "loan_scam": [
        "กู้เงิน", "สินเชื่อ", "เงินด่วน", "ไม่ต้องค้ำ", "ไม่เช็คเครดิต",
        "อนุมัติทันที", "โอนทันที", "ดอกเบี้ย 0", "สินเชื่อออนไลน์",
        "กู้ออนไลน์", "บัตรเครดิต", "ไฟแนนซ์", "ผ่อนง่าย"
    ]
}

# Suspicious link and urgency patterns
LINK_PATTERNS = ["http://", "https://", "bit.ly", "เว็บ", "คลิก", "link", "ลิงก์"]
URGENCY_PATTERNS = ["ด่วน", "ทันที", "รีบ", "เร่ง", "ตอนนี้"]


class KeywordScamClassifier(IScamClassifier):
    """
    Keyword-based scam classifier
    
    Uses pattern matching with Thai keywords for fast detection.
    Suitable for real-time classification with acceptable accuracy.
    """
    
    def __init__(self):
        self._model_name = "keyword_classifier"
        self._version = "v1.1-hybrid"
        
        # Load Lists
        self.blacklist = self._load_list("app/data/blacklist.txt")
        self.whitelist = self._load_list("app/data/whitelist.txt")
        
        logger.info(f"Initialized {self._model_name} {self._version} (BL:{len(self.blacklist)}, WL:{len(self.whitelist)})")

    def _load_list(self, path: str) -> set:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return {line.strip().lower() for line in f if line.strip() and not line.startswith('#')}
        except Exception as e:
            logger.warning(f"Could not load list {path}: {e}")
            return set()
    
    @property
    def model_name(self) -> str:
        return self._model_name
    
    def get_version(self) -> str:
        return self._version
    
    def classify(self, message: str, threshold: float = 0.5) -> ClassificationResult:
        """
        Classify message using keyword matching
        
        Args:
            message: Thai message to classify
            threshold: Classification threshold (default 0.5)
            
        Returns:
            ClassificationResult with prediction
            
        Raises:
            ValidationError: If message is invalid
            ModelError: If classification fails
        """
        # Validate input
        if not message or not message.strip():
            raise ValidationError("Message cannot be empty")
        
        if not isinstance(threshold, (int, float)) or not 0.0 <= threshold <= 1.0:
            raise ValidationError("Threshold must be between 0.0 and 1.0")
        
        try:
            logger.debug(f"Classifying message (length: {len(message)})")
            
            message_lower = message.lower()
            
            # 1. WHITELIST CHECK (Pass immediately)
            for good in self.whitelist:
                if good in message_lower:
                    logger.info(f"✅ Whitelist matched: {good}")
                    return ClassificationResult(
                        is_scam=False, risk_score=0.0, category='safe', confidence=1.0
                    )

            # 2. BLACKLIST CHECK (Block immediately)
            for bad in self.blacklist:
                if bad in message_lower:
                    logger.info(f"🚫 Blacklist matched: {bad}")
                    return ClassificationResult(
                        is_scam=True, risk_score=1.0, category='blacklisted', confidence=1.0
                    )
            
            # Check each scam category
            category_scores = {}
            for category, keywords in SCAM_PATTERNS.items():
                matches = sum(1 for keyword in keywords if keyword.lower() in message_lower)
                if matches > 0:
                    # Score based on keyword density
                    score = min(0.5 + (matches * 0.15), 0.95)
                    category_scores[category] = score
            
            # Check for suspicious patterns (boost score)
            pattern_boost = 0.0
            link_count = sum(1 for pattern in LINK_PATTERNS if pattern in message_lower)
            if link_count > 0:
                pattern_boost += min(link_count * 0.1, 0.2)
            
            urgency_count = sum(1 for pattern in URGENCY_PATTERNS if pattern in message_lower)
            if urgency_count > 0:
                pattern_boost += min(urgency_count * 0.05, 0.1)
            
            # Determine final category and score
            if category_scores:
                category = max(category_scores, key=category_scores.get)
                risk_score = min(category_scores[category] + pattern_boost, 1.0)
            else:
                category = 'safe'
                risk_score = max(0.0, pattern_boost)
            
            is_scam = risk_score >= threshold and category != 'safe'
            
            logger.debug(f"Classification result: category={category}, risk={risk_score:.2f}, scam={is_scam}")
            
            return ClassificationResult(
                is_scam=is_scam,
                risk_score=risk_score,
                category=category,
                confidence=0.65  # ~65% accuracy based on benchmarks
            )
            
        except Exception as e:
            logger.error(f"Classification error: {e}", exc_info=True)
            raise ModelError(f"Classification failed: {str(e)}")


# Factory function for compatibility
def get_classifier() -> IScamClassifier:
    """Get keyword classifier instance"""
    return KeywordScamClassifier()


# Legacy function for backward compatibility
def classify_scam(message: str, threshold: float = 0.5) -> Tuple[bool, float, str]:
    """
    Legacy classification function (deprecated - use KeywordScamClassifier instead)
    
    Kept for backward compatibility with existing code.
    """
    classifier = get_classifier()
    result = classifier.classify(message, threshold)
    return result.is_scam, result.risk_score, result.category
