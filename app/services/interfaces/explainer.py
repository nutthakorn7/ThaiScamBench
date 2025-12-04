"""
Explainer Interface

Defines the contract for generating explanations of scam detections.
"""
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class ExplanationResult:
    """Result of explanation generation"""
    reason: str
    advice: str
    confidence: float = 1.0
    llm_used: bool = False
    
    def __post_init__(self):
        """Validate values"""
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0.0 and 1.0")


class IExplainer(ABC):
    """
    Interface for explanation generation
    
    Generates human-readable explanations for scam detection results.
    """
    
    @abstractmethod
    async def explain(
        self,
        message: str,
        category: str,
        risk_score: float,
        is_scam: bool
    ) -> ExplanationResult:
        """
        Generate explanation for detection result
        
        Args:
            message: Original message (may be sanitized)
            category: Detected category
            risk_score: Risk score (0.0-1.0)
            is_scam: Whether classified as scam
            
        Returns:
            ExplanationResult with reason and advice
            
        Raises:
            ServiceError: If explanation generation fails
        """
        pass
    
    @abstractmethod
    def get_version(self) -> str:
        """
        Get explainer version
        
        Returns:
            Version string (e.g., "mock-v1.0", "gpt4-v1.0")
        """
        pass
    
    @property
    @abstractmethod
    def provider(self) -> str:
        """
        Get provider name
        
        Returns:
            Provider name (e.g., "mock", "openai", "anthropic")
        """
        pass
