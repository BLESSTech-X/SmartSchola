import os
import requests
from datetime import datetime


def send_sms(phone: str, message: str, cfg: dict) -> dict:
    """
    Send an SMS via Africa's Talking or custom gateway.
    Falls back to file logging if no API key is configured.
    cfg: dict with sms_provider, sms_api_key, sms_username, sms_sender_id
    """
    provider = cfg.get("sms_provider", "africas_talking")
    api_key = cfg.get("sms_api_key", "")
    username = cfg.get("sms_username", "")
    sender_id = cfg.get("sms_sender_id", "")
    custom_url = os.getenv("SMS_GATEWAY_URL", "")

    # Fallback: log to file if no credentials
    if not api_key:
        _log_to_file(phone, message)
        return {"status": "logged", "provider": "file"}

    if provider == "africas_talking":
        return _send_africas_talking(phone, message, api_key, username, sender_id)
    elif provider == "custom" and custom_url:
        return _send_custom(phone, message, api_key, custom_url)
    else:
        _log_to_file(phone, message)
        return {"status": "logged", "provider": "file"}


def _send_africas_talking(phone: str, message: str, api_key: str, username: str, sender_id: str) -> dict:
    try:
        payload = {
            "username": username or "sandbox",
            "to": phone,
            "message": message,
        }
        if sender_id:
            payload["from"] = sender_id

        resp = requests.post(
            "https://api.africastalking.com/version1/messaging",
            data=payload,
            headers={
                "apiKey": api_key,
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=10,
        )
        data = resp.json()
        recipients = data.get("SMSMessageData", {}).get("Recipients", [])
        if recipients and recipients[0].get("statusCode") == 101:
            return {"status": "delivered", "provider": "africas_talking"}
        return {"status": "failed", "provider": "africas_talking", "detail": str(data)}
    except Exception as e:
        return {"status": "failed", "provider": "africas_talking", "detail": str(e)}


def _send_custom(phone: str, message: str, api_key: str, url: str) -> dict:
    try:
        resp = requests.post(
            url,
            json={"to": phone, "message": message, "api_key": api_key},
            timeout=10,
        )
        if resp.status_code == 200:
            return {"status": "delivered", "provider": "custom"}
        return {"status": "failed", "provider": "custom"}
    except Exception as e:
        return {"status": "failed", "provider": "custom", "detail": str(e)}


def _log_to_file(phone: str, message: str):
    try:
        with open("sms_log.txt", "a") as f:
            f.write(f"[{datetime.utcnow().isoformat()}] TO: {phone} | MSG: {message}\n")
    except Exception:
        pass
