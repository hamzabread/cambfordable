"""
Transactional email delivery over SMTP (Gmail by default).

Mirrors the shape of core/whatsapp.py: a single module-level service that
degrades to a logged no-op when credentials are absent, so enrollment flows
never fail because mail is misconfigured.
"""
import html
import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from core.email_config import email_settings

logger = logging.getLogger(__name__)

BRAND_COLOR = "#0866ef"


class EmailService:
    def __init__(self):
        self.host = email_settings.SMTP_HOST
        self.port = email_settings.SMTP_PORT
        self.username = email_settings.SMTP_USERNAME
        self.password = email_settings.SMTP_PASSWORD
        self.use_tls = email_settings.SMTP_USE_TLS
        # Gmail rewrites the From header to the authenticated account anyway,
        # so fall back to the username when EMAIL_FROM is not set.
        self.from_email = email_settings.EMAIL_FROM or email_settings.SMTP_USERNAME
        self.from_name = email_settings.EMAIL_FROM_NAME

        if not self.is_configured:
            logger.warning("SMTP credentials not configured; emails will not be sent")

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.username and self.password and self.from_email)

    # ── helpers ───────────────────────────────────────────────

    def _send(self, to_email: str, subject: str, text_body: str, html_body: str) -> bool:
        """Send one message. Never raises — returns False on any failure."""
        if not self.is_configured or not to_email:
            return False

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email
        message.set_content(text_body)
        message.add_alternative(html_body, subtype="html")

        try:
            with smtplib.SMTP(self.host, self.port, timeout=20) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(message)
            logger.info(f"Email '{subject}' sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    # ── public API ────────────────────────────────────────────

    def send_enrollment_welcome_email(
        self,
        to_email: str,
        student_name: str,
        course_name: str,
        whatsapp_invite_link: Optional[str] = None,
    ) -> bool:
        """
        Confirm enrollment and hand the student the course WhatsApp group link.

        Sent when an admin approves a payment proof or enrolls a student
        directly. The WhatsApp section is omitted when the course has no
        invite link configured.
        """
        greeting = student_name or "there"
        portal_url = f"{email_settings.FRONTEND_URL.rstrip('/')}/dashboard"

        text_lines = [
            f"Hi {greeting},",
            "",
            f"You're now enrolled in {course_name}. Your payment has been verified "
            f"and your course access is active.",
            "",
        ]
        if whatsapp_invite_link:
            text_lines += [
                "Join the course WhatsApp group to get announcements, class",
                "reminders and support from your teacher and classmates:",
                whatsapp_invite_link,
                "",
            ]
        text_lines += [
            f"Open your dashboard: {portal_url}",
            "",
            "See you in class!",
            "The Cambfordable Team",
        ]

        safe_name = html.escape(greeting)
        safe_course = html.escape(course_name)

        whatsapp_block = ""
        if whatsapp_invite_link:
            safe_link = html.escape(whatsapp_invite_link, quote=True)
            whatsapp_block = f"""
            <tr><td style="padding:0 32px 8px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#14532d;">
                  Join your course WhatsApp group
                </p>
                <p style="margin:0 0 16px;font-size:13px;line-height:20px;color:#166534;">
                  Announcements, class reminders and help from your teacher and classmates
                  all happen here. Tap below to join.
                </p>
                <a href="{safe_link}"
                   style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;
                          font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;">
                  Join the WhatsApp group
                </a>
                <p style="margin:14px 0 0;font-size:11px;color:#4d7c5a;word-break:break-all;">
                  Or paste this link into your browser: {safe_link}
                </p>
              </div>
            </td></tr>
            """

        html_body = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr><td style="background:{BRAND_COLOR};padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
              Cambfordable
            </p>
          </td></tr>

          <tr><td style="padding:32px 32px 8px;">
            <h1 style="margin:0 0 14px;font-size:22px;line-height:30px;font-weight:800;color:#0f172a;">
              You're enrolled in {safe_course}
            </h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155;">
              Hi {safe_name},
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
              Your payment has been verified and your access to
              <strong style="color:#0f172a;">{safe_course}</strong> is now active.
              You can view your classes, homework and quizzes from your dashboard.
            </p>
          </td></tr>

          {whatsapp_block}

          <tr><td style="padding:24px 32px 32px;">
            <a href="{html.escape(portal_url, quote=True)}"
               style="display:inline-block;background:{BRAND_COLOR};color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
              Go to my dashboard
            </a>
          </td></tr>

          <tr><td style="border-top:1px solid #e2e8f0;padding:20px 32px;">
            <p style="margin:0;font-size:12px;line-height:18px;color:#64748b;">
              See you in class!<br />The Cambfordable Team
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
"""

        return self._send(
            to_email=to_email,
            subject=f"You're enrolled in {course_name} 🎉",
            text_body="\n".join(text_lines),
            html_body=html_body,
        )

    def send_notice(self, to_email: str, student_name: str, subject: str, message: str, link_path: str = "/courses") -> bool:
        """A short plain notice with one button, used for billing reminders."""
        greeting = student_name or "there"
        url = f"{email_settings.FRONTEND_URL.rstrip('/')}{link_path}"
        text_body = "\n".join([f"Hi {greeting},", "", message, "", f"Open the portal: {url}", "", "The Cambfordable Team"])
        html_body = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:{BRAND_COLOR};">Cambfordable</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155;">Hi {html.escape(greeting)},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">{html.escape(message)}</p>
      <a href="{html.escape(url, quote=True)}" style="display:inline-block;background:{BRAND_COLOR};color:#ffffff;text-decoration:none;
         font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">Open my courses</a>
    </div>
  </body>
</html>
"""
        return self._send(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)

    def send_password_reset_email(self, to_email: str, student_name: str, reset_url: str) -> bool:
        greeting = student_name or "there"
        text_body = "\n".join([
            f"Hi {greeting},",
            "",
            "Someone asked to reset the password for your Cambfordable account.",
            "Open this link within 30 minutes to choose a new password:",
            reset_url,
            "",
            "If you didn't ask for this, ignore this email; your password stays the same.",
            "The Cambfordable Team",
        ])
        safe_url = html.escape(reset_url, quote=True)
        html_body = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:{BRAND_COLOR};">Cambfordable</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155;">Hi {html.escape(greeting)},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
        Someone asked to reset the password for your account. This link works for 30 minutes.
      </p>
      <a href="{safe_url}" style="display:inline-block;background:{BRAND_COLOR};color:#ffffff;text-decoration:none;
         font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">Choose a new password</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#64748b;">
        If you didn't ask for this, ignore this email; your password stays the same.
      </p>
    </div>
  </body>
</html>
"""
        return self._send(
            to_email=to_email,
            subject="Reset your Cambfordable password",
            text_body=text_body,
            html_body=html_body,
        )


# Global instance
email_service = EmailService()
