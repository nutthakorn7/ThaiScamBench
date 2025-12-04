"""Pydantic schemas for API request/response models"""
from pydantic import BaseModel, Field
from typing import Optional


class ScamCheckRequest(BaseModel):
    """Request model for scam detection"""
    message: str = Field(
        ...,
        description="ข้อความที่ต้องการตรวจสอบ (Message to check for scam)",
        min_length=1,
        max_length=5000
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "คุณมีพัสดุค้างชำระ กรุณาคลิกลิงก์เพื่อชำระเงิน: https://fake-site.com"
            }
        }


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
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_scam": True,
                "risk_score": 0.85,
                "category": "parcel_scam",
                "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง พบคำว่า 'พัสดุ' และมีลิงก์น่าสงสัย",
                "advice": "ไม่ควรคลิกลิงก์ หรือให้ข้อมูลส่วนตัว ควรติดต่อบริษัทขนส่งโดยตรงเพื่อยืนยัน"
            }
        }


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Service health status")
    version: str = Field(..., description="API version")
    model_version: str = Field(..., description="Scam classifier version")
    llm_version: str = Field(..., description="LLM explainer version")
    environment: str = Field(..., description="Running environment")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "0.1.0",
                "model_version": "mock-v1.0",
                "llm_version": "mock-v1.0",
                "environment": "dev"
            }
        }
