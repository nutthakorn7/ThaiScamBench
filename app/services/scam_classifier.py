"""Mock Scam Classifier Service

This module provides a mock implementation of the scam classification service.
In production, this will be replaced with a real ML model from HuggingFace or similar.
"""
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


# Mock scam patterns (Thai keywords)
SCAM_PATTERNS = {
    "parcel_scam": ["พัสดุ", "ค้างชำระ", "ค่าธรรมเนียม", "ขนส่ง"],
    "banking_scam": ["ธนาคาร", "บัตร", "หมดอายุ", "ยืนยันตัวตน", "OTP"],
    "prize_scam": ["ยินดี", "รางวัล", "โชคดี", "ถูกรางวัล", "แจ็คพอต"],
    "investment_scam": ["ลงทุน", "กำไร", "รวยเร็ว", "ได้เงิน", "รายได้เสริม"],
    "impersonation_scam": ["เจ้าหน้าที่", "ตำรวจ", "ศาล", "DSI", "เรียกเก็บ"],
}

LINK_PATTERNS = ["http://", "https://", "bit.ly", "เว็บ", "คลิก"]


def classify_scam(message: str) -> Tuple[bool, float, str]:
    """
    Classify if a message is a scam (MOCK implementation)
    
    Args:
        message: ข้อความที่ต้องการตรวจสอบ
        
    Returns:
        Tuple of (is_scam, risk_score, category)
        - is_scam: True if message is classified as scam
        - risk_score: Float between 0-1 indicating scam probability
        - category: Scam category (e.g., 'parcel_scam', 'safe')
    """
    logger.info(f"Classifying message (length: {len(message)})")
    
    message_lower = message.lower()
    
    # Check each scam category
    max_score = 0.0
    detected_category = "safe"
    
    for category, keywords in SCAM_PATTERNS.items():
        matches = sum(1 for keyword in keywords if keyword in message_lower)
        
        if matches > 0:
            # Calculate score based on keyword matches
            score = min(0.5 + (matches * 0.15), 0.95)
            
            # Boost score if contains suspicious links
            has_link = any(pattern in message_lower for pattern in LINK_PATTERNS)
            if has_link:
                score = min(score + 0.15, 0.95)
            
            if score > max_score:
                max_score = score
                detected_category = category
    
    # Determine if it's a scam based on threshold
    is_scam = max_score >= 0.5
    risk_score = max_score if is_scam else 0.1
    
    logger.info(
        f"Classification result: is_scam={is_scam}, "
        f"risk_score={risk_score:.2f}, category={detected_category}"
    )
    
    return is_scam, risk_score, detected_category


# Interface for future real model integration
class ScamClassifierInterface:
    """
    Interface for scam classifier implementations.
    Future implementations can inherit from this class.
    """
    
    def classify(self, message: str) -> Tuple[bool, float, str]:
        """Classify a message for scam indicators"""
        raise NotImplementedError
    
    def get_version(self) -> str:
        """Get classifier version"""
        raise NotImplementedError


class MockScamClassifier(ScamClassifierInterface):
    """Mock implementation of scam classifier"""
    
    def __init__(self):
        self.version = "mock-v1.0"
    
    def classify(self, message: str) -> Tuple[bool, float, str]:
        return classify_scam(message)
    
    def get_version(self) -> str:
        return self.version
