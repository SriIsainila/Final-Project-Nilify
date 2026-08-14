import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def _send_smtp(message: EmailMessage) -> None:
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


async def send_password_reset_email(recipient: str, reset_url: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        if settings.app_env == "development":
            logger.warning("Password reset link for local development: %s", reset_url)
        return

    message = EmailMessage()
    message["Subject"] = "Reset your Nilify password"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your Nilify password.\n\n"
        f"Open this link to choose a new password:\n{reset_url}\n\n"
        f"This link expires in {settings.password_reset_expire_minutes} minutes. "
        "If you did not request this, you can ignore this email."
    )
    await asyncio.to_thread(_send_smtp, message)
