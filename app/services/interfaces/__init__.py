"""
Service interfaces package
"""
from app.services.interfaces.classifier import IScamClassifier
from app.services.interfaces.explainer import IExplainer

__all__ = [
    "IScamClassifier",
    "IExplainer",
]
