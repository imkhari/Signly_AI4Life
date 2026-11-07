from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = Field(default="dev", description="Environment: dev | demo | prod")
    LLM_PROVIDER: str = Field(
        default="mock",
        description="LLM provider: mock | anthropic | openai | gemini",
    )
    LLM_MODEL: str = Field(default="", description="LLM model name")
    LLM_API_KEY: str = Field(default="", description="API key for LLM provider")
    LLM_TIMEOUT_S: float = Field(
        default=4.0,
        description="Timeout in seconds for LLM call",
    )
    SESSION_IDLE_MINUTES: int = Field(
        default=10,
        description="Minutes before session reset when idle",
    )
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173",
        description="Comma-separated CORS origins",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
