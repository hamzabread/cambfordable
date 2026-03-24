"""
WhatsApp integration using Twilio API

Sends individual messages to students via Twilio WhatsApp Business API.
WhatsApp groups are managed manually — Twilio sends 1-to-1 messages only.
"""
import os
import logging
from typing import List, Optional
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

load_dotenv()

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self):
        """Initialize Twilio WhatsApp client"""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM")  # e.g., "whatsapp:+1234567890"
        self.client = None

        if not all([self.account_sid, self.auth_token, self.whatsapp_from]):
            logger.warning("Twilio WhatsApp credentials not configured")
            return

        self.client = Client(self.account_sid, self.auth_token)

    # ── helpers ───────────────────────────────────────────────

    def _send(self, to_phone: str, body: str) -> bool:
        """Send a single WhatsApp message to a phone number."""
        if not self.client or not to_phone:
            return False
        try:
            msg = self.client.messages.create(
                from_=self.whatsapp_from,
                to=f"whatsapp:{to_phone}",
                body=body,
            )
            logger.info(f"WhatsApp msg sent to {to_phone}, SID: {msg.sid}")
            return True
        except TwilioRestException as e:
            logger.error(f"Twilio error sending to {to_phone}: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending to {to_phone}: {e}")
            return False

    # ── public API ────────────────────────────────────────────

    def send_welcome_message(
        self,
        phone_number: str,
        course_name: str,
        invite_link: Optional[str] = None,
    ) -> bool:
        """
        Send a welcome WhatsApp message when a student enrols in a course.
        Optionally includes the manual WhatsApp-group invite link.
        """
        body = f"Welcome to *{course_name}*! 🎉 You've been successfully enrolled."
        if invite_link:
            body += f"\n\nJoin the course WhatsApp group here:\n{invite_link}"
        return self._send(phone_number, body)

    def send_live_class_notification(
        self,
        phone_numbers: List[str],
        class_title: str,
        join_url: str,
    ) -> int:
        """
        Notify every enrolled student individually that a class is live.

        Returns the number of messages sent successfully.
        """
        body = (
            f"🎥 *CLASS LIVE NOW!* 🎥\n\n"
            f"Class: {class_title}\n\n"
            f"Join here: {join_url}\n\n"
            f"Hurry! Class is starting now!"
        )
        sent = 0
        for phone in phone_numbers:
            if self._send(phone, body):
                sent += 1
        logger.info(f"Live notification for '{class_title}': {sent}/{len(phone_numbers)} sent")
        return sent


# Global instance
whatsapp_service = WhatsAppService()
