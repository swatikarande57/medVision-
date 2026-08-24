from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "MedVision AI Service"
    api_key: str = ""
    inference_device: str = "cpu"
    artifacts_dir: str = "./artifacts"


settings = Settings()
