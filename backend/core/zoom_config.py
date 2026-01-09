from pydantic_settings import BaseSettings, SettingsConfigDict

class ZoomSettings(BaseSettings):
    ZOOM_CLIENT_ID: str
    ZOOM_CLIENT_SECRET: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

zoom_settings = ZoomSettings()
