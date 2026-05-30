"""Rotas de autenticação e perfil do usuário."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..security import criar_token, get_usuario_atual, hash_senha, verificar_senha
from .. import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def registrar(dados: schemas.RegisterIn, db: Session = Depends(get_db)):
    # username e e-mail únicos (case-insensitive no e-mail)
    if db.query(Usuario).filter(func.lower(Usuario.username) == dados.username.lower()).first():
        raise HTTPException(status_code=400, detail="Este nome de usuário já está em uso.")
    if db.query(Usuario).filter(func.lower(Usuario.email) == dados.email.lower()).first():
        raise HTTPException(status_code=400, detail="Já existe uma conta com este e-mail.")

    usuario = Usuario(
        username=dados.username,
        email=dados.email,
        nome_completo=dados.nome_completo,
        senha_hash=hash_senha(dados.password),
        tipo=dados.tipo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    token = criar_token(usuario.id)
    return {"access_token": token, "token_type": "bearer", "usuario": schemas.serial_usuario(usuario)}


@router.post("/login")
def login(dados: schemas.LoginIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(func.lower(Usuario.username) == dados.username.lower()).first()
    if not usuario or not verificar_senha(dados.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada.")

    token = criar_token(usuario.id)
    return {"access_token": token, "token_type": "bearer", "usuario": schemas.serial_usuario(usuario)}


@router.get("/me")
def eu(usuario: Usuario = Depends(get_usuario_atual)):
    return schemas.serial_usuario(usuario)
