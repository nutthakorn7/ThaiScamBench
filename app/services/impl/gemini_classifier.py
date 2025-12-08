"""
Gemini Classifier Implementation
Uses Google Gemini API as a smart classifier for uncertain cases.
"""
import logging
import os
import json
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.services.interfaces.classifier import IScamClassifier, ClassificationResult
from app.core.exceptions import ModelError

logger = logging.getLogger(__name__)


class GeminiClassifier(IScamClassifier):
    """
    AI-powered scam classifier using Google Gemini.
    
    Designed to be used as a "tiebreaker" for uncertain cases where
    rule-based classification is ambiguous (risk score 0.4-0.6).
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self._model_name = "gemini_classifier"
        self._version = "gemini-1.5-flash"
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        
        if self._api_key:
            genai.configure(api_key=self._api_key)
            self._safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
            self._model = genai.GenerativeModel(self._version)
            logger.info(f"✅ Gemini Classifier initialized ({self._version})")
        else:
            self._model = None
            logger.warning("⚠️ GOOGLE_API_KEY not found. Gemini Classifier disabled.")
    
    @property
    def model_name(self) -> str:
        return self._model_name
    
    def get_version(self) -> str:
        return self._version
    
    async def classify_async(self, message: str, threshold: float = 0.5) -> ClassificationResult:
        """
        Classify message using Gemini AI (async).
        
        Args:
            message: Thai message to classify
            threshold: Classification threshold (default 0.5)
            
        Returns:
            ClassificationResult with AI prediction
        """
        if not self._model:
            raise ModelError("Gemini API not configured")
        
        try:
            prompt = self._build_classification_prompt(message)
            
            response = await self._model.generate_content_async(
                prompt,
                safety_settings=self._safety_settings
            )
            
            text_response = response.text
            
            # Parse JSON response
            try:
                clean_json = text_response.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                
                is_scam = data.get("is_scam", False)
                risk_score = float(data.get("risk_score", 0.5))
                category = data.get("category", "unknown")
                confidence = float(data.get("confidence", 0.7))
                
                logger.info(f"🤖 Gemini Classification: scam={is_scam}, risk={risk_score:.2f}, category={category}")
                
                return ClassificationResult(
                    is_scam=is_scam,
                    risk_score=risk_score,
                    category=category,
                    confidence=confidence
                )
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse Gemini response: {text_response}")
                # Return conservative result
                return ClassificationResult(
                    is_scam=True,  # Err on side of caution
                    risk_score=0.6,
                    category="parse_error",
                    confidence=0.3
                )
        
        except Exception as e:
            logger.error(f"❌ Gemini classification error: {e}", exc_info=True)
            raise ModelError(f"Gemini classification failed: {str(e)}")
    
    def classify(self, message: str, threshold: float = 0.5) -> ClassificationResult:
        """
        Synchronous wrapper (not recommended, use classify_async).
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.classify_async(message, threshold))
    
    def _build_classification_prompt(self, message: str) -> str:
        """Build classification prompt for Gemini."""
        return f"""You are 'ThaiScamDetector AI', an expert in detecting Thai scams.

Analyze this message: "{message}"

**Task:**
1. Determine if this is a SCAM or SAFE.
2. Assign a risk score (0.0 = definitely safe, 1.0 = definitely scam).
3. Identify the scam category if applicable.
4. Rate your confidence (0.0-1.0).

**Categories:**
- parcel_scam (พัสดุปลอม)
- banking_scam (ธนาคารปลอม)
- prize_scam (รางวัลปลอม)
- investment_scam (การลงทุนหลอกลวง)
- impersonation_scam (ปลอมแปลงเป็นเจ้าหน้าที่)
- loan_scam (สินเชื่อหลอกลวง)
- safe (ข้อความปกติ)

**Common Thai Scam Patterns:**
- Urgency (ด่วน, รีบ, หมดเขต)
- Money requests (โอนเงิน, ฝากเงิน, ค่าธรรมเนียม)
- Fake authority (ธนาคาร, ตำรวจ, ศาล)
- Too good to be true (ถูกรางวัล, กำไรสูง, ฟรี)

Return **ONLY** valid JSON (no markdown):
{{
    "is_scam": boolean,
    "risk_score": float (0.0-1.0),
    "category": "category_name",
    "confidence": float (0.0-1.0),
    "reasoning": "brief Thai explanation"
}}"""


# Singleton instance
_gemini_classifier_instance: Optional[GeminiClassifier] = None


def get_gemini_classifier() -> Optional[GeminiClassifier]:
    """Get or create Gemini Classifier instance."""
    global _gemini_classifier_instance
    if _gemini_classifier_instance is None:
        try:
            _gemini_classifier_instance = GeminiClassifier()
        except Exception as e:
            logger.error(f"Failed to initialize Gemini Classifier: {e}")
            _gemini_classifier_instance = None
    return _gemini_classifier_instance
