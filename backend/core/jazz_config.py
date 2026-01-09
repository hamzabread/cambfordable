from pydantic_settings import BaseSettings, SettingsConfigDict

class JazzCashSettings(BaseSettings):
    JAZZCASH_MERCHANT_ID: str
    JAZZCASH_PASSWORD: str
    JAZZCASH_INTEGRITY_SALT: str
    JAZZCASH_PAYMENT_URL: str
    JAZZCASH_RETURN_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

settings = JazzCashSettings()
