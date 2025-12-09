"""Pydantic schemas for API request/response models"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal


class ScamCheckRequest(BaseModel):
    """Request model for scam detection"""
    message: str = Field(
        ...,
        description="ข้อความที่ต้องการตรวจสอบ (Message to check for scam)",
        min_length=1,
        max_length=5000
    )
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "คุณมีพัสดุค้างชำระ กรุณาคลิกลิงก์เพื่อชำระเงิน: https://fake-site.com"
        }
    })


class ScamCheckResponse(BaseModel):
    """Response model for scam detection results"""
    is_scam: bool = Field(
        ...,
        description="เป็นข้อความหลอกลวงหรือไม่ (Is this a scam message)"
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="คะแนนความเสี่ยง 0-1 (Risk score from 0 to 1)"
    )
    category: str = Field(
        ...,
        description="ประเภทของการหลอกลวง (Scam category)"
    )
    reason: str = Field(
        ...,
        description="เหตุผลที่ตรวจพบ (Reason for detection)"
    )
    advice: str = Field(
        ...,
        description="คำแนะนำในการป้องกัน (Safety advice)"
    )
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "is_scam": True,
            "risk_score": 0.85,
            "category": "parcel_scam",
            "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง พบคำว่า 'พัสดุ' และมีลิงก์น่าสงสัย",
            "advice": "ไม่ควรคลิกลิงก์ หรือให้ข้อมูลส่วนตัว ควรติดต่อบริษัทขนส่งโดยตรงเพื่อยืนยัน"
        }
    })


class PublicDetectRequest(BaseModel):
    """Request model for public scam detection endpoint"""
    message: str = Field(
        ...,
        description="ข้อความที่ต้องการตรวจสอบ (Message to check)",
        min_length=1,
        max_length=5000
    )
    channel: Optional[Literal["SMS", "LINE", "Facebook", "WhatsApp", "Email", "อื่นๆ"]] = Field(
        None,
        description="ช่องทางที่ได้รับข้อความ (Channel where message was received)"
    )
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "คุณมีพัสดุค้างชำระ กรุณาคลิกลิงก์: https://fake.com",
            "channel": "SMS"
        }
    })


class PublicDetectResponse(BaseModel):
    """Response model for public scam detection endpoint"""
    request_id: str = Field(..., description="Unique request ID")
    is_scam: bool = Field(..., description="เป็นข้อความหลอกลวงหรือไม่")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="คะแนนความเสี่ยง 0-1")
    category: str = Field(..., description="ประเภทการหลอกลวง")
    reason: str = Field(..., description="เหตุผลที่ตรวจพบ")
    advice: str = Field(..., description="คำแนะนำในการป้องกัน")
    model_version: str = Field(..., description="เวอร์ชันของโมเดล")
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "is_scam": True,
            "risk_score": 0.85,
            "category": "parcel_scam",
            "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
            "advice": "🚫 ไม่ควรคลิกลิงก์...",
            "model_version": "mock-v1.0"
        }
    })


class PartnerDetectRequest(BaseModel):
    """Request model for partner scam detection endpoint"""
    message: str = Field(
        ...,
        description="ข้อความที่ต้องการตรวจสอบ (Message to check)",
        min_length=1,
        max_length=5000
    )
    channel: Optional[Literal["SMS", "LINE", "Facebook", "WhatsApp", "Email", "อื่นๆ"]] = Field(
        None,
        description="ช่องทางที่ได้รับข้อความ (Channel)"
    )
    user_ref: Optional[str] = Field(
        None,
        max_length=255,
        description="Partner's user reference for tracking"
    )
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "คุณมีพัสดุค้างชำระ กรุณาคลิก https://fake.com",
            "channel": "SMS",
            "user_ref": "user_12345"
        }
    })


class PartnerDetectResponse(BaseModel):
    """Response model for partner scam detection endpoint"""
    request_id: str = Field(..., description="Unique request ID")
    is_scam: bool = Field(..., description="เป็นข้อความหลอกลวงหรือไม่")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="คะแนนความเสี่ยง 0-1")
    category: str = Field(..., description="ประเภทการหลอกลวง")
    reason: str = Field(..., description="เหตุผลที่ตรวจพบ")
    advice: str = Field(..., description="คำแนะนำในการป้องกัน")
    model_version: str = Field(..., description="เวอร์ชันของโมเดล")
    llm_version: str = Field(..., description="เวอร์ชันของ LLM")
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "request_id": "550e8400-e29b-41d4-a716-446655440000",
            "is_scam": True,
            "risk_score": 0.85,
            "category": "parcel_scam",
            "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
            "advice": "🚫 ไม่ควรคลิกลิงก์...",
            "model_version": "mock-v1.0",
            "llm_version": "mock-v1.0"
        }
    })


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Service health status")
    version: str = Field(..., description="API version")
    model_version: str = Field(..., description="Scam classifier version")
    llm_version: str = Field(..., description="LLM explainer version")
    environment: str = Field(..., description="Running environment")
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "healthy",
            "version": "0.1.0",
            "model_version": "mock-v1.0",
            "llm_version": "mock-v1.0",
            "environment": "dev"
        }
    })


class PublicReportRequest(BaseModel):
    """Request model for manual scam reporting"""
    text: str = Field(..., description="Message text or details")
    is_scam: bool = Field(..., description="Flag if it is considered a scam")
    additional_info: Optional[str] = Field(None, description="Additional comments")
    contact_info: Optional[str] = Field(None, description="Optional contact info")

