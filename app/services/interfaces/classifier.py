"""
Scam Classifier Interface

Defines the contract for all scam classification implementations.
"""
from abc import ABC, abstractmethod
from typing import Tuple
from dataclasses import dataclass


@dataclass
class ClassificationResult:
    """Result of scam classification"""
    is_scam: bool
    risk_score: float
    category: str
    confidence: float = 1.0
    
    def __post_init__(self):
        """Validate result values"""
        if not 0.0 <= self.risk_score <= 1.0:
            raise ValueError("risk_score must be between 0.0 and 1.0")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0.0 and 1.0")


class IScamClassifier(ABC):
    """
    Interface for scam classification models
    
    All classifier implementations must inherit from this interface
    to ensure consistent behavior across different models.
    """
    
    @abstractmethod
    def classify(self, message: str, threshold: float = 0.5) -> ClassificationResult:
        """
        Classify if a message is a scam
        
        Args:
            message: Message text to classify
            threshold: Classification threshold (0.0-1.0)
            
        Returns:
            ClassificationResult with prediction details
            
        Raises:
            ValueError: If message is empty or invalid
            ModelError: If classification fails
        """
        pass
    
    @abstractmethod
    def get_version(self) -> str:
        """
        Get model version
        
        Returns:
            Version string (e.g., "keyword-v1.0", "bert-v2.1")
        """
        pass
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """
        Get model name
        
        Returns:
            Model name (e.g., "keyword_classifier", "thai_bert")
        """
        pass
