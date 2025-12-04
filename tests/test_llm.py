"""Tests for LLM explainer service"""
import pytest
import json
from app.services.llm_explainer import (
    explain_with_llm,
    parse_llm_json_response,
    LLM_PROMPT_TEMPLATE,
    CATEGORY_TRANSLATIONS
)


class TestLLMExplainer:
    """Test cases for LLM explainer"""
    
    def test_explain_fake_officer(self):
        """Test explanation for fake officer category"""
        reason, advice = explain_with_llm("test message", "fake_officer")
        
        assert isinstance(reason, str)
        assert isinstance(advice, str)
        assert len(reason) > 0
        assert len(advice) > 0
        assert "เจ้าหน้าที่" in reason or "ราชการ" in reason
    
    def test_explain_parcel_scam(self):
        """Test explanation for parcel scam"""
        reason, advice = explain_with_llm("test", "parcel_scam")
        
        assert "พัสดุ" in reason
        assert len(advice) > 0
    
    def test_explain_all_categories(self):
        """Test explanation for all categories"""
        categories = [
            "fake_officer", "parcel_scam", "loan_scam",
            "investment_scam", "otp_phishing", "marketplace_scam",
            "other_scam", "normal"
        ]
        
        for category in categories:
            reason, advice = explain_with_llm("test", category)
            assert len(reason) > 0
            assert len(advice) > 0
    
    def test_parse_valid_json(self):
        """Test parsing valid JSON response"""
        valid_json = json.dumps({
            "is_scam": True,
            "risk_score": 0.85,
            "category": "parcel_scam",
            "reason": "test reason",
            "advice": "test advice"
        })
        
        result = parse_llm_json_response(valid_json)
        
        assert result['is_scam'] is True
        assert result['risk_score'] == 0.85
        assert result['category'] == "parcel_scam"
    
    def test_parse_invalid_json(self):
        """Test parsing invalid JSON response"""
        invalid_json = "This is not JSON"
        
        result = parse_llm_json_response(invalid_json)
        
        assert 'error' in result or 'raw_response' in result
    
    def test_parse_json_with_extra_text(self):
        """Test parsing JSON embedded in text"""
        response = 'Here is the analysis: {"is_scam": true, "category": "loan_scam"} end'
        
        result = parse_llm_json_response(response)
        
        # Should extract JSON even with surrounding text
        assert isinstance(result, dict)
    
    def test_prompt_template_format(self):
        """Test LLM prompt template"""
        prompt = LLM_PROMPT_TEMPLATE.format(
            message="test message",
            category="parcel_scam"
        )
        
        assert "test message" in prompt
        assert "parcel_scam" in prompt
        assert "JSON" in prompt
    
    def test_category_translations_complete(self):
        """Test all categories have translations"""
        expected_categories = [
            'fake_officer', 'parcel_scam', 'loan_scam',
            'investment_scam', 'otp_phishing', 'marketplace_scam',
            'other_scam', 'normal'
        ]
        
        for cat in expected_categories:
            assert cat in CATEGORY_TRANSLATIONS
            assert len(CATEGORY_TRANSLATIONS[cat]) > 0
