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
    secret_key: str = "your-secret-key-change-in-production"  # For JWT signing
    
    # JWT Configuration
    jwt_secret_key: str = "jwt-secret-key-change-in-production"  # Separate key for JWT
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # 30 minutes
    refresh_token_expire_days: int = 7  # 7 days
    
    # Admin Authentication
    admin_username: str = "admin"  # Default admin username
    admin_password_hash: str = ""  # Will be set via environment or script
    admin_token: str = "change-this-token-in-production"  # ⚠️ DEPRECATED - Use JWT instead!
    admin_allowed_ips: str = ""  # Comma-separated IPs (empty = allow all)
    
    # Detection Thresholds
    public_threshold: float = 0.5   # Conservative - catch more potential scams
    partner_threshold: float = 0.7  # Strict - reduce false positives for enterprise
    
    # Redis & Caching
    redis_url: str = "redis://localhost:6379/0"
    cache_enabled: bool = True
    cache_ttl_seconds: int = 86400  # 24 hours
    
    # Pagination
    default_page_size: int = 50
    max_page_size: int = 100
    
    # Audit Logging
    audit_log_enabled: bool = True
    audit_log_retention_days: int = 90
    
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
