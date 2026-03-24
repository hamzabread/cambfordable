from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_MINUTES: int
    
    # WhatsApp Integration (Twilio)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

app_settings = AppSettings()
