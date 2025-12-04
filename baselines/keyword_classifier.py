"""
Baseline 1: Keyword-based Classifier

This is the current implementation used in production.
Uses pattern matching with Thai keywords for scam detection.
"""
from app.services.scam_classifier import classify_scam

class KeywordBaseline:
    """
    Keyword-based scam classifier
    
    Uses predefined patterns and keywords to detect scam messages.
    Fast inference (< 5ms) but limited accuracy (~65%).
    """
    
    def __init__(self):
        self.model_name = "keyword_classifier"
        self.version = "v1.0"
    
    def predict(self, text: str) -> dict:
        """
        Predict if text is a scam message
        
        Args:
            text (str): Thai message to classify
            
        Returns:
            dict: {
                "category": str,  # scam category or "normal" 
                "risk_score": float  # 0.0-1.0
            }
        """
        # Use existing classifier
        is_scam, risk_score, category = classify_scam(text, threshold=0.5)
        
        return {
            "category": category,
            "risk_score": risk_score,
            "is_scam": is_scam,
            "model": self.model_name,
            "version": self.version
        }
    
    def get_info(self) -> dict:
        """Get model information"""
        return {
            "name": self.model_name,
            "version": self.version,
            "type": "rule_based",
            "accuracy": "~65%",
            "speed": "< 5ms"
        }

if __name__ == "__main__":
    # Example usage
    model = KeywordBaseline()
    
    # Test messages
    test_messages = [
        "คุณมีพัสดุค้างชำระ 50 บาท",
        "สวัสดีครับ วันนี้อากาศดีมาก",
        "ธนาคารแจ้ง: กรุณาแจ้งรหัส OTP",
    ]
    
    print(f"Model: {model.get_info()}\n")
    
    for msg in test_messages:
        result = model.predict(msg)
        print(f"Message: {msg[:50]}...")
        print(f"  Category: {result['category']}")
        print(f"  Risk: {result['risk_score']:.2f}")
        print(f"  Is Scam: {result['is_scam']}\n")
