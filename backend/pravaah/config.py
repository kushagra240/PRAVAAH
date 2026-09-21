from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "PRAVAAH"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini Config
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.7-flash"
    
    # Region & Geospatial Config
    DEFAULT_REGION: str = "odisha_coastal"
    H3_RESOLUTION: int = 8
    
    # Storage & DB
    DATABASE_URL: str = "sqlite:///./pravaah.db"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
