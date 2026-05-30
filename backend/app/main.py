"""Ponto de entrada da API FastAPI do HelpDesk Nassau."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, chamados, painel, usuarios

# Cria as tabelas no banco se ainda não existirem.
# Em projeto maior usaríamos Alembic; aqui é suficiente e simples.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HelpDesk Nassau API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(chamados.router)
app.include_router(painel.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "servico": "helpdesk-nassau-api"}
