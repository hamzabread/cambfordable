from pydantic_settings import BaseSettings, SettingsConfigDict


class EmailSettings(BaseSettings):
    """SMTP configuration for outbound transactional email.

    Defaults target Gmail. Use a Google account "App Password" (not the
    account password) for SMTP_PASSWORD — Gmail rejects plain passwords.
    Every field has a default so the app still boots when email is not
    configured; EmailService simply becomes a no-op in that case.
    """

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "Cambfordable"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


email_settings = EmailSettings()
