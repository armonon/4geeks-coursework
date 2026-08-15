"""Transactional email delivery.

Provider: **Resend** (https://resend.com). Chosen over SendGrid because
its onboarding sender (`onboarding@resend.dev`) can send to the account
owner's address in development without verifying a custom domain in
DNS — which is the thing that most often blocks this exercise.

The API key is read from the environment and never hardcoded. If
`RESEND_API_KEY` is unset the sender falls back to console delivery:
the message (including the reset link) is printed to the server log
instead of being sent. That keeps the whole flow testable locally
without credentials, and is loudly labelled so it can never be mistaken
for real delivery.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import httpx
from dotenv import load_dotenv

load_dotenv()

RESEND_ENDPOINT = "https://api.resend.com/emails"


def api_key() -> str:
    return os.environ.get("RESEND_API_KEY", "").strip()


def from_address() -> str:
    # Resend's shared onboarding sender works without domain verification.
    return os.environ.get("EMAIL_FROM", "TrackFlow <onboarding@resend.dev>").strip()


def frontend_base_url() -> str:
    """Where the reset link should point — the backoffice, not the API."""
    return os.environ.get("FRONTEND_BASE_URL", "http://localhost:3100").rstrip("/")


@dataclass
class SendResult:
    delivered: bool
    provider: str
    detail: str


def _render_reset_email(reset_url: str, minutes: int) -> tuple[str, str]:
    """Return (plain_text, html). Both are sent; clients pick one.

    The HTML is deliberately simple and inline-styled: email clients
    strip <style> blocks and have no flexbox, so a single centred table
    with inline styles is what actually renders on mobile.
    """
    text = (
        "Reset your TrackFlow password\n\n"
        f"We received a request to reset your password. This link expires in {minutes} minutes "
        "and can only be used once.\n\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can safely ignore this email — "
        "your password will not change.\n"
    )

    html = f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">TrackFlow</p>
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;">
                  Reset your password
                </h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
                  We received a request to reset your password. This link expires in
                  <strong>{minutes} minutes</strong> and can only be used once.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="background:#0f172a;border-radius:6px;">
                      <a href="{reset_url}"
                         style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;
                                color:#ffffff;text-decoration:none;">
                        Choose a new password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#64748b;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0 0 20px;font-size:12px;line-height:1.6;word-break:break-all;color:#334155;">
                  {reset_url}
                </p>
                <p style="margin:0;padding-top:16px;border-top:1px solid #e2e8f0;
                          font-size:12px;line-height:1.6;color:#64748b;">
                  If you did not request this, you can safely ignore this email — your
                  password will not change.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    return text, html


def send_password_reset(to_email: str, token: str, expires_minutes: int) -> SendResult:
    """Send the reset link. Never raises — a delivery failure must not
    change the API's response, because /auth/forgot-password always
    returns 200 to avoid leaking whether an address is registered."""
    reset_url = f"{frontend_base_url()}/reset-password?token={token}"
    text, html = _render_reset_email(reset_url, expires_minutes)

    key = api_key()
    if not key:
        # Console fallback — clearly labelled, never mistaken for real delivery.
        print(
            "\n"
            "  ┌──────────────────────────────────────────────────────────────┐\n"
            "  │ EMAIL NOT SENT — RESEND_API_KEY is not set                   │\n"
            "  │ Console fallback so the flow is testable without a key.      │\n"
            "  └──────────────────────────────────────────────────────────────┘\n"
            f"  to:   {to_email}\n"
            f"  link: {reset_url}\n",
            flush=True,
        )
        return SendResult(
            delivered=False,
            provider="console",
            detail="RESEND_API_KEY unset; link written to the server log.",
        )

    try:
        response = httpx.post(
            RESEND_ENDPOINT,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_address(),
                "to": [to_email],
                "subject": "Reset your TrackFlow password",
                "text": text,
                "html": html,
            },
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        print(f"  email: transport error talking to Resend: {exc}", flush=True)
        return SendResult(False, "resend", f"transport error: {exc}")

    if response.status_code >= 400:
        # Logged, not raised: the caller must still return 200.
        print(
            f"  email: Resend rejected the send ({response.status_code}): "
            f"{response.text[:200]}",
            flush=True,
        )
        return SendResult(False, "resend", f"HTTP {response.status_code}")

    return SendResult(True, "resend", "sent")
