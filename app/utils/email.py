
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from pydantic import EmailStr
from app.config import settings

logger = logging.getLogger(__name__)

async def send_new_user_email(email: EmailStr, password: str, name: Optional[str] = None):
    """
    Send welcome email to new user with their credentials using smtplib.
    """
    try:
        # 1. Mock Mode (Development)
        if (settings.environment == "dev" and "example.com" in settings.mail_username) or not settings.mail_password:
            logger.info("📧 [MOCK EMAIL] To: %s", email)
            logger.info("Subject: Welcome to ThaiScamDetector")
            logger.info("Body: Your password is: %s", password)
            return True

        # 2. Production Mode (SMTP)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to ThaiScamDetector - Account Created"
        msg["From"] = settings.mail_from
        msg["To"] = email

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
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
          </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))

        # Connect to SMTP Server
        logger.info(f"Connecting to SMTP: {settings.mail_server}:{settings.mail_port}")
        server = smtplib.SMTP(settings.mail_server, settings.mail_port)
        if settings.mail_starttls:
            server.starttls()
        
        server.login(settings.mail_username, settings.mail_password)
        server.sendmail(settings.mail_from, email, msg.as_string())
        server.quit()
        
        logger.info(f"✅ Email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {email}: {e}")
        return False
