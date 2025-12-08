"""
Gemini Vision Analyzer
Visual forensics for detecting fake bank slips, forged logos, and scam graphics.
"""
import logging
import os
import json
import base64
from typing import Optional
from dataclasses import dataclass

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

logger = logging.getLogger(__name__)


@dataclass
class VisualAnalysisResult:
    """Result of visual forensics analysis."""
    is_suspicious: bool
    visual_risk_score: float  # 0.0 - 1.0
    reason: str
    detected_patterns: list[str]
    confidence: float


class GeminiVisionAnalyzer:
    """
    Uses Gemini Vision API to detect visual scam indicators.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self._model_name = "gemini-1.5-flash"  # Supports vision, cost-effective
        
        if self._api_key:
            genai.configure(api_key=self._api_key)
            self._safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
            self._model = genai.GenerativeModel(self._model_name)
            logger.info(f"✅ Gemini Vision Analyzer initialized ({self._model_name})")
        else:
            self._model = None
            logger.warning("⚠️ GOOGLE_API_KEY not found. Gemini Vision disabled.")
    
    async def analyze_image(self, image_content: bytes) -> VisualAnalysisResult:
        """
        Analyze image for visual scam indicators.
        
        Args:
            image_content: Raw image bytes
            
        Returns:
            VisualAnalysisResult with forensic findings
        """
        if not self._model:
            # Fallback: No analysis
            return VisualAnalysisResult(
                is_suspicious=False,
                visual_risk_score=0.0,
                reason="Gemini Vision not configured",
                detected_patterns=[],
                confidence=0.0
            )
        
        try:
            # Convert bytes to PIL Image format for Gemini
            import PIL.Image
            import io
            image = PIL.Image.open(io.BytesIO(image_content))
            
            # Forensic prompt
            prompt = self._build_forensic_prompt()
            
            # Call Gemini Vision
            response = await self._model.generate_content_async(
                [prompt, image],
                safety_settings=self._safety_settings
            )
            
            text_response = response.text
            
            # Parse JSON response
            try:
                clean_json = text_response.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                
                # Extract fields
                is_fake_slip = data.get("is_fake_slip", False)
                has_suspicious_logos = data.get("has_suspicious_logos", False)
                has_urgency_graphics = data.get("has_urgency_graphics", False)
                
                # Calculate risk score
                risk_score = 0.0
                detected_patterns = []
                
                if is_fake_slip:
                    risk_score += 0.7
                    detected_patterns.append("fake_bank_slip")
                
                if has_suspicious_logos:
                    risk_score += 0.2
                    detected_patterns.append("suspicious_logo")
                
                if has_urgency_graphics:
                    risk_score += 0.1
                    detected_patterns.append("urgency_graphic")
                
                risk_score = min(risk_score, 1.0)
                is_suspicious = risk_score >= 0.5
                
                reason = data.get("summary_reason", "Visual analysis completed")
                confidence = data.get("confidence", 0.7)
                
                logger.info(f"🔍 Vision Analysis: risk={risk_score:.2f}, patterns={detected_patterns}")
                
                return VisualAnalysisResult(
                    is_suspicious=is_suspicious,
                    visual_risk_score=risk_score,
                    reason=reason,
                    detected_patterns=detected_patterns,
                    confidence=confidence
                )
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Gemini Vision JSON: {text_response}")
                # Return conservative result
                return VisualAnalysisResult(
                    is_suspicious=True,  # Err on side of caution
                    visual_risk_score=0.5,
                    reason="AI analysis completed but format error",
                    detected_patterns=["parse_error"],
                    confidence=0.3
                )
        
        except Exception as e:
            logger.error(f"❌ Gemini Vision error: {e}", exc_info=True)
            # Return neutral result on error
            return VisualAnalysisResult(
                is_suspicious=False,
                visual_risk_score=0.0,
                reason=f"Analysis failed: {str(e)}",
                detected_patterns=["error"],
                confidence=0.0
            )
    
    def _build_forensic_prompt(self) -> str:
        """Build comprehensive forensic analysis prompt."""
        return """You are a forensic analyst specializing in Thai financial fraud detection.

Analyze this image for scam indicators:

**Task 1: Fake Bank Slip Detection**
- Is this a genuine bank transfer slip or digitally edited/fake?
- Check for: mismatched fonts, pixelation around numbers, watermark removal, color inconsistencies
- Does the layout match standard Thai bank slip formats (Kasikorn, SCB, Bangkok Bank, etc.)?

**Task 2: Logo Verification**
- Are there bank or government logos present?
- Are they authentic high-quality logos or low-quality replicas?
- Any suspicious branding or fake company names?

**Task 3: Scam Graphic Patterns**
- Countdown timers or "limited time offer" graphics?
- Excessive red/urgent colors or warning symbols?
- Poor quality design indicating rushed scam graphics?

Return **ONLY** valid JSON (no markdown):
{
    "is_fake_slip": boolean,
    "has_suspicious_logos": boolean,
    "has_urgency_graphics": boolean,
    "summary_reason": "Brief Thai explanation of findings",
    "confidence": float (0-1, how certain you are),
    "specific_red_flags": ["font mismatch", "pixelation", etc.]
}"""


# Singleton instance
_vision_analyzer_instance: Optional[GeminiVisionAnalyzer] = None


def get_vision_analyzer() -> GeminiVisionAnalyzer:
    """Get or create Gemini Vision Analyzer instance."""
    global _vision_analyzer_instance
    if _vision_analyzer_instance is None:
        _vision_analyzer_instance = GeminiVisionAnalyzer()
    return _vision_analyzer_instance
