
import logging
from typing import List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls,
    USE_CREDENTIALS=settings.use_credentials,
    VALIDATE_CERTS=settings.validate_certs
)

async def send_new_user_email(email: EmailStr, password: str, name: Optional[str] = None):
    """
    Send welcome email to new user with their credentials.
    """
    try:
        if settings.environment == "dev" and "example.com" in settings.mail_username:
            # Simulate email sending in Dev if config not set
            logger.info("📧 [MOCK EMAIL] To: %s", email)
            logger.info("Subject: Welcome to ThaiScamDetector")
            logger.info("Body: Your password is: %s", password)
            return True

        message = MessageSchema(
            subject="Welcome to ThaiScamDetector - Account Created",
            recipients=[email],
            body=f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to ThaiScamDetector!</h2>
                <p>Hello {name or 'User'},</p>
                <p>Your account has been created successfully.</p>
                <p><strong>Your Login Credentials:</strong></p>
                <ul>
                    <li><strong>Email:</strong> {email}</li>
                    <li><strong>Password:</strong> {password}</li>
                </ul>
                <p>Please log in at: <a href="https://{settings.domain_name}/admin/login">https://{settings.domain_name}/admin/login</a></p>
                <p>We recommend changing your password after your first login.</p>
                <br>
                <p>Best regards,</p>
                <p>The ThaiScamDetector Team</p>
            </div>
            """,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"✅ Email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {email}: {e}")
        # Don't throw error to client, just log it
        return False
