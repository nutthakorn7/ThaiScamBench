"""
Scam Scorer Service
Uses Regex patterns and heuristic scoring to evaluate the risk level of a message.
"""
import re
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class ScoreResult:
    score: int
    reasons: List[str]
    is_scam: bool

class ScamScorer:
    """
    Evaluates text against weighted patterns to determine scam risk.
    """
    
    # High Risk Patterns (Score +40)
    PATTERNS_HIGH_RISK = {
        "gambling": [
            r"slot", r"pg\w+", r"bet", r"spin", r"baccarat", 
            r"บาคาร่า", r"สล็อต", r"แตกง่าย", r"เว็บตรง", r"ฝากถอน"
        ],
        "bank_account": [
            r"\d{3}-\d-\d{5}-\d",  # Standard format
            r"\d{3}-\d{3}-\d{4}",
            r"ธ\.?กสิกร", r"ธ\.?\s?ไทยพาณิชย์", r"ธ\.?\s?กรุงเทพ"
        ]
    }

    # Medium Risk Patterns (Score +20)
    PATTERNS_MEDIUM_RISK = {
        "money": [
            r"บาท", r"โอน", r"เงินกู้", r"รายได้", r"กำไร", r"ลงทุน", 
            r"เครดิตฟรี", r"แจกฟรี"
        ],
        "urgency": [
            r"ด่วน", r"หมดเขต", r"ทันที", r"จำนวนจำกัด", r"เหลือเพียง"
        ],
        "credentials": [
            r"รหัสผ่าน", r"otp", r"ยืนยันตัวตน", r"บัญชีถูกระงับ"
        ]
    }

    # Low Risk Patterns (Score +10)
    PATTERNS_LOW_RISK = {
        "contact": [
            r"แอดไลน์", r"add line", r"คลิก", r"กดที่นี่", r"link"
        ],
        "url": [
            r"https?://[^\s]+"
        ]
    }

    def __init__(self):
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns for performance."""
        self.compiled_high = {k: [re.compile(p, re.IGNORECASE) for p in v] for k, v in self.PATTERNS_HIGH_RISK.items()}
        self.compiled_medium = {k: [re.compile(p, re.IGNORECASE) for p in v] for k, v in self.PATTERNS_MEDIUM_RISK.items()}
        self.compiled_low = {k: [re.compile(p, re.IGNORECASE) for p in v] for k, v in self.PATTERNS_LOW_RISK.items()}

    def calculate_score(self, text: str) -> ScoreResult:
        score = 0
        reasons = []
        
        # Check High Risk (+40 each category, max once per category)
        for category, patterns in self.compiled_high.items():
            for pattern in patterns:
                if pattern.search(text):
                    score += 40
                    reasons.append(f"High Risk: {category}")
                    break # Count category only once

        # Check Medium Risk (+20 each category)
        for category, patterns in self.compiled_medium.items():
            for pattern in patterns:
                if pattern.search(text):
                    score += 20
                    reasons.append(f"Medium Risk: {category}")
                    break

        # Check Low Risk (+10 each category)
        for category, patterns in self.compiled_low.items():
            for pattern in patterns:
                if pattern.search(text):
                    score += 10
                    reasons.append(f"Low Risk: {category}")
                    break
        
        # Cap score at 100
        score = min(score, 100)
        
        # Threshold for classification
        is_scam = score >= 50
        
        return ScoreResult(score=score, reasons=reasons, is_scam=is_scam)
