"""Configuration management for Thai Scam Detection API"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Environment
    environment: Literal["dev", "prod"] = "dev"
    
    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    
    # Model Configuration
    model_version: str = "mock-v1.0"
    scam_classifier_type: str = "mock"
    
    # LLM Configuration
    llm_version: str = "mock-v1.0"
    llm_provider: str = "mock"
    openai_api_key: str = ""
    
    # Service Configuration
    api_title: str = "Thai Scam Detection API"
    api_version: str = "0.1.0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Rate Limiting
    rate_limit_requests: int = 60   # requests per window (increased for testing)
    rate_limit_window: int = 60     # window in seconds (1 minute)
    
    # Database
    database_url: str = "sqlite:///./thai_scam_detector.db"
    secret_key: str = "your-secret-key-change-in-production"  # For future JWT use
    
    # Admin Authentication
    admin_token: str = "change-this-token-in-production"  # ⚠️ CHANGE IN PRODUCTION!
    admin_allowed_ips: str = ""  # Comma-separated IPs (empty = allow all)
    
    # Detection Thresholds
    public_threshold: float = 0.5   # Conservative - catch more potential scams
    partner_threshold: float = 0.7  # Strict - reduce false positives for enterprise
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == "dev"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == "prod"


# Global settings instance
settings = Settings()
