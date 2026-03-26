# backend/email_service.py
# ------------------------
# SMTP email delivery using stdlib smtplib.
# All config comes from environment variables; sending is silently skipped
# if SMTP_HOST is not set, so the app works without email configured.

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def _smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_email(to: str, subject: str, body_html: str, body_text: str) -> bool:
    """Send an email. Returns True on success, False if skipped or on error."""
    if not _smtp_configured():
        logger.debug("SMTP not configured — skipping email to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to], msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def send_prescription_expiry_warning(
    to: str, username: str, expiring: list[dict]
) -> bool:
    """
    Send a prescription expiry warning email.

    expiring: list of dicts with keys: name, person, expiration_date, days_left
    """
    rows_html = "".join(
        f"<tr><td>{r['person']}</td><td>{r['name']}</td>"
        f"<td>{r['expiration_date']}</td><td>{r['days_left']} days</td></tr>"
        for r in expiring
    )
    rows_text = "\n".join(
        f"  {r['person']} — {r['name']} expires {r['expiration_date']} ({r['days_left']} days)"
        for r in expiring
    )

    body_html = f"""
    <p>Hi {username},</p>
    <p>The following prescriptions in your Medicine Cabinet are expiring soon:</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Person</th><th>Medication</th><th>Expires</th><th>Days Left</th></tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
    <p>Log in to request renewals before they expire.</p>
    """

    body_text = (
        f"Hi {username},\n\n"
        "The following prescriptions are expiring soon:\n"
        f"{rows_text}\n\n"
        "Log in to request renewals before they expire."
    )

    return send_email(
        to=to,
        subject="Medicine Cabinet — Prescription Expiry Reminder",
        body_html=body_html,
        body_text=body_text,
    )
