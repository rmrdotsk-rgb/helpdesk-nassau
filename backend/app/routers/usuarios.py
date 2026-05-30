"""Rotas de usuário: edição do próprio perfil e listagem de técnicos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..security import exige_equipe, get_usuario_atual
from .. import constants as c
from .. import schemas

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


@router.patch("/me")
def atualizar_meu_perfil(
    dados: schemas.PerfilUpdateIn,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    if dados.email and dados.email.lower() != usuario.email.lower():
        existe = (
            db.query(Usuario)
            .filter(func.lower(Usuario.email) == dados.email.lower(), Usuario.id != usuario.id)
            .first()
        )
        if existe:
            raise HTTPException(status_code=400, detail="Já existe uma conta com este e-mail.")
        usuario.email = dados.email

    if dados.nome_completo is not None:
        usuario.nome_completo = dados.nome_completo
    if dados.telefone is not None:
        usuario.telefone = dados.telefone
    if dados.setor is not None:
        usuario.setor = dados.setor

    db.commit()
    db.refresh(usuario)
    return schemas.serial_usuario(usuario)


@router.get("/tecnicos")
def listar_tecnicos(
    _: Usuario = Depends(exige_equipe),
    db: Session = Depends(get_db),
):
    """Técnicos e admins, usados no select de 'técnico responsável'."""
    tecnicos = (
        db.query(Usuario)
        .filter(or_(Usuario.tipo == c.TIPO_TECNICO, Usuario.tipo == c.TIPO_ADMIN))
        .order_by(Usuario.nome_completo, Usuario.username)
        .all()
    )
    return [schemas.serial_usuario_mini(u) for u in tecnicos]
