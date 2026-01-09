from pydantic_settings import BaseSettings, SettingsConfigDict

class ZoomServerSettings(BaseSettings):
    ZOOM_ACCOUNT_ID_S2S: str
    ZOOM_CLIENT_ID_S2S: str
    ZOOM_CLIENT_SECRET_S2S: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

zoom_settings = ZoomServerSettings()
