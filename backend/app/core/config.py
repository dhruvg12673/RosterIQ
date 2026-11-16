import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Search for .env in backend/ directory, current working directory, and parent directory
_backend_dir = Path(__file__).resolve().parent.parent.parent
_root_dir = _backend_dir.parent

for env_path in [
    _backend_dir / ".env",
    _root_dir / ".env",
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
]:
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path, override=False)


class Settings(BaseSettings):
    APP_NAME: str = "RosterIQ"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = ""
    SECRET_KEY: str = "rosteriq-secure-production-secret-key-2026"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ENVIRONMENT: str = "production"

    def __init__(self, **values):
        super().__init__(**values)
        if not self.DATABASE_URL:
            self.DATABASE_URL = os.getenv("DATABASE_URL", "")

        if not self.DATABASE_URL:
            # If explicit test flag allows fallback
            if os.getenv("TEST_MODE") == "1" or os.getenv("ALLOW_SQLITE") == "1":
                self.DATABASE_URL = "sqlite:///./rosteriq.db"
            else:
                raise RuntimeError(
                    "DATABASE_URL is not set! Please configure DATABASE_URL in backend/.env "
                    "or as an environment variable to connect to your Neon PostgreSQL database. "
                    "Silent fallback to SQLite is strictly disabled."
                )

        # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": (str(_backend_dir / ".env"), str(_root_dir / ".env"), ".env"),
        "extra": "ignore",
    }


settings = Settings()
