"""Configurações da aplicação, lidas de variáveis de ambiente / arquivo .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Conexão com o PostgreSQL (rodando no Docker por padrão).
    DATABASE_URL: str = "postgresql+psycopg2://helpdesk:helpdesk@localhost:5432/helpdesk_nassau"

    # Chave usada para assinar os tokens JWT. Troque em produção.
    SECRET_KEY: str = "troque-esta-chave-em-producao-helpdesk-nassau"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 horas

    # Origens liberadas para o frontend React (Vite usa 5173).
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
