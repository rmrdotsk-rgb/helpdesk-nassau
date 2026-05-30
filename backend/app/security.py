"""Autenticação e autorização: senha, token JWT e dependências de permissão."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Usuario

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=True)


# ---------- senha ----------
def hash_senha(senha: str) -> str:
    # bcrypt aceita no máximo 72 bytes; cortamos com segurança.
    senha_bytes = senha.encode("utf-8")[:72]
    return bcrypt.hashpw(senha_bytes, bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8")[:72], senha_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------- token ----------
def criar_token(usuario_id: int) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(usuario_id), "exp": expira}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def _erro_credencial(detalhe: str = "Não autenticado"):
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalhe,
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------- dependências ----------
def get_usuario_atual(
    cred: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    try:
        payload = jwt.decode(cred.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = int(payload.get("sub"))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise _erro_credencial("Token inválido ou expirado")

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.ativo:
        raise _erro_credencial("Usuário não encontrado")
    return usuario


def exige_equipe(usuario: Usuario = Depends(get_usuario_atual)) -> Usuario:
    """Libera apenas técnicos e administradores."""
    if not usuario.is_equipe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Esta área é exclusiva da equipe de suporte.")
    return usuario


def exige_admin(usuario: Usuario = Depends(get_usuario_atual)) -> Usuario:
    """Libera apenas administradores."""
    if not usuario.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Esta área é exclusiva de administradores.")
    return usuario
