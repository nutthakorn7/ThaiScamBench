
"""
Gemini Explainer Implementation

Uses Google Generative AI (Gemini Pro) to analyze scam detection.
"""
import logging
import os
import json
from typing import Dict, Any, Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.services.interfaces.explainer import IExplainer, ExplanationResult
from app.core.exceptions import ServiceError
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiExplainer(IExplainer):
    """
    Explainer using Google Gemini Pro.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self._provider = "gemini"
        self._version = "gemini-pro"  # Stable model
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        
        if self._api_key:
            genai.configure(api_key=self._api_key)
            # Configure safety settings to be less restrictive for analysis (we need to read scam texts)
            self._safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
            self._model = genai.GenerativeModel('gemini-pro')
            logger.info(f"Initialized {self._provider} explainer with model {self._version}")
        else:
            logger.warning("GOOGLE_API_KEY not found. GeminiExplainer will fail or needs fallback.")
    
    @property
    def provider(self) -> str:
        return self._provider
    
    def get_version(self) -> str:
        return self._version
    
    async def explain(
        self,
        message: str,
        category: str,
        risk_score: float,
        is_scam: bool
    ) -> ExplanationResult:
        """
        Analyze message using Gemini AI.
        
        Note: We actually ask Gemini to perform the classification AND explanation 
        to verify the rule-based result (Hybrid approach).
        """
        if not self._api_key:
             # Fallback if Key is missing (should be handled by Dependency injection preference)
             raise ServiceError("Gemini API Key missing")

        try:
            prompt = self._build_prompt(message, category)
            
            # Use synchronous call in thread pool to avoid specific gRPC async bugs on Linux/Docker
            import asyncio
            from functools import partial
            
            loop = asyncio.get_event_loop()
            
            # Run sync generate_content in thread pool
            response = await loop.run_in_executor(
                None, 
                partial(
                    self._model.generate_content, 
                    prompt, 
                    safety_settings=self._safety_settings
                )
            )
            
            text_response = response.text
            
            # Parse JSON from response
            try:
                # Remove Markdown code blocks if present
                clean_json = text_response.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                
                return ExplanationResult(
                    reason=data.get("reason", "ไม่สามารถวิเคราะห์ได้"),
                    advice=data.get("advice", "โปรดระมัดระวัง"),
                    confidence=data.get("confidence", 0.0),
                    llm_used=True,
                    metadata={
                        "ai_is_scam": data.get("is_scam", False),
                        "ai_risk_score": data.get("risk_score", 0.0)
                    }
                )
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Gemini JSON: {text_response}")
                return ExplanationResult(
                    reason="AI วิเคราะห์เสร็จสิ้นแต่รูปแบบข้อมูลไม่ถูกต้อง",
                    advice="โปรดพิจารณาความเสี่ยงด้วยตนเอง",
                    confidence=0.5,
                    llm_used=True
                )

        except Exception as e:
            logger.error(f"Gemini explanation error: {e}", exc_info=True)
            # Graceful Fallback for Demo/Production Stability
            # Do NOT raise ServiceError, return a fallback result
            return ExplanationResult(
                reason="AI Analysis Unavailable (Server Error)",
                advice="Please exercise caution. Verification system is under load.",
                confidence=0.5,
                llm_used=False  # Indicate fallback
            )

    def _build_prompt(self, message: str, initial_category: str) -> str:
        return f"""
        You are 'ThaiScamDetector AI', a cybersecurity expert specializing in Thai scams.
        
        Analyze this message content: "{message}"
        
        Context: Rule-based system flagged this as category: "{initial_category}"
        
        Task:
        1. Determine if this is a SCAM or SAFE/NEUTRAL.
        2. Assign a risk score (0.0 - 1.0).
        3. Explain WHY in Thai (short, concise, natural).
        4. Give actionable advice in Thai.
        
        Output stricly JSON format:
        {{
            "is_scam": boolean,
            "risk_score": float,
            "reason": "Thai explanation...",
            "advice": "Thai advice...",
            "confidence": float (0.0-1.0 how sure you are)
        }}
        """
