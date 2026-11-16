import socket
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


def get_engine_args(db_url: str) -> dict:
    """
    Configure SQLAlchemy engine arguments tailored for PostgreSQL/Neon or SQLite.
    Resolves DNS fallback if the local ISP/router DNS fails to resolve remote cloud hosts.
    """
    if db_url.startswith("sqlite"):
        return {
            "connect_args": {"check_same_thread": False}
        }

    connect_args = {}
    
    # Configure SSL
    if "neon" in db_url or "sslmode" in db_url:
        connect_args["sslmode"] = "require"

    # Handle DNS resolution fallback for Neon/cloud hosts
    try:
        parsed = urlparse(db_url)
        hostname = parsed.hostname
        if hostname and hostname not in ("localhost", "127.0.0.1"):
            try:
                socket.gethostbyname(hostname)
            except (socket.gaierror, socket.herror, OSError):
                try:
                    import dns.resolver
                    resolver = dns.resolver.Resolver()
                    resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
                    answers = resolver.resolve(hostname, "A")
                    if answers:
                        connect_args["hostaddr"] = answers[0].to_text()
                except Exception:
                    pass
    except Exception:
        pass

    return {
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
        "connect_args": connect_args,
    }


db_url = settings.DATABASE_URL
engine_kwargs = get_engine_args(db_url)
engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
