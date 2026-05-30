"""Schemas Pydantic para entrada/saída da API e funções de serialização.

Os campos derivados (rótulos, cores, atraso, tempo de resolução) são
calculados em Python na hora de serializar, igual ao projeto original.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from . import constants as c
from .models import Chamado, Comentario, Historico, Usuario


# ============ ENTRADA ============
class RegisterIn(BaseModel):
    nome_completo: str = Field(min_length=2, max_length=150)
    email: EmailStr
    username: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=6, max_length=128)
    tipo: str = c.TIPO_ALUNO

    @field_validator("tipo")
    @classmethod
    def tipo_publico(cls, v):
        if v not in c.TIPOS_PUBLICOS:
            raise ValueError("Cadastro público permite apenas aluno, professor ou funcionário.")
        return v

    @field_validator("username")
    @classmethod
    def username_simples(cls, v):
        v = v.strip()
        if not v.replace("_", "").replace(".", "").isalnum():
            raise ValueError("Use apenas letras, números, ponto ou underline no usuário.")
        return v


class LoginIn(BaseModel):
    username: str
    password: str


class PerfilUpdateIn(BaseModel):
    nome_completo: Optional[str] = Field(default=None, max_length=150)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(default=None, max_length=20)
    setor: Optional[str] = Field(default=None, max_length=80)


class ChamadoCreateIn(BaseModel):
    titulo: str = Field(min_length=3, max_length=120)
    descricao: str = Field(min_length=3)
    categoria: str = "outro"
    prioridade: str = "media"
    localizacao: str = "outro"

    @field_validator("categoria")
    @classmethod
    def cat_valida(cls, v):
        if v not in c.LABEL_CATEGORIA:
            raise ValueError("Categoria inválida.")
        return v

    @field_validator("prioridade")
    @classmethod
    def pri_valida(cls, v):
        if v not in c.LABEL_PRIORIDADE:
            raise ValueError("Prioridade inválida.")
        return v

    @field_validator("localizacao")
    @classmethod
    def local_valido(cls, v):
        if v not in c.LABEL_LOCAL:
            raise ValueError("Localização inválida.")
        return v


class ComentarioIn(BaseModel):
    texto: str = Field(min_length=1)


class GerenciarIn(BaseModel):
    status: str
    prioridade: str
    tecnico_id: Optional[int] = None
    solucao_final: str = ""

    @field_validator("status")
    @classmethod
    def status_valido(cls, v):
        if v not in c.LABEL_STATUS:
            raise ValueError("Status inválido.")
        return v

    @field_validator("prioridade")
    @classmethod
    def pri_valida(cls, v):
        if v not in c.LABEL_PRIORIDADE:
            raise ValueError("Prioridade inválida.")
        return v


class PainelUpdateIn(BaseModel):
    chamado_id: int
    status: Optional[str] = None
    tecnico_id: Optional[int] = None


# ============ SERIALIZAÇÃO (saída) ============
def serial_usuario(u: Optional[Usuario]) -> Optional[dict]:
    if u is None:
        return None
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "nome": u.nome,
        "tipo": u.tipo,
        "tipo_label": c.LABEL_TIPO.get(u.tipo, u.tipo),
        "telefone": u.telefone,
        "setor": u.setor,
        "is_admin": u.is_admin,
        "is_tecnico": u.is_tecnico,
        "is_equipe": u.is_equipe,
        "is_comum": u.is_comum,
    }


def serial_usuario_mini(u: Optional[Usuario]) -> Optional[dict]:
    if u is None:
        return None
    return {"id": u.id, "nome": u.nome, "tipo": u.tipo, "tipo_label": c.LABEL_TIPO.get(u.tipo, u.tipo)}


def serial_comentario(co: Comentario) -> dict:
    return {
        "id": co.id,
        "texto": co.texto,
        "criado_em": co.criado_em,
        "autor": serial_usuario_mini(co.autor),
    }


def serial_historico(h: Historico) -> dict:
    return {
        "id": h.id,
        "acao": h.acao,
        "criado_em": h.criado_em,
        "autor": serial_usuario_mini(h.autor),
    }


def _base_chamado(ch: Chamado) -> dict:
    return {
        "id": ch.id,
        "titulo": ch.titulo,
        "descricao": ch.descricao,
        "categoria": ch.categoria,
        "categoria_label": c.LABEL_CATEGORIA.get(ch.categoria, ch.categoria),
        "prioridade": ch.prioridade,
        "prioridade_label": c.LABEL_PRIORIDADE.get(ch.prioridade, ch.prioridade),
        "prioridade_cor": c.PRIORIDADE_COR.get(ch.prioridade, "secondary"),
        "status": ch.status,
        "status_label": c.LABEL_STATUS.get(ch.status, ch.status),
        "status_cor": c.STATUS_COR.get(ch.status, "secondary"),
        "localizacao": ch.localizacao,
        "localizacao_label": c.LABEL_LOCAL.get(ch.localizacao, ch.localizacao),
        "solicitante": serial_usuario_mini(ch.solicitante),
        "tecnico": serial_usuario_mini(ch.tecnico),
        "data_abertura": ch.data_abertura,
        "data_atualizacao": ch.data_atualizacao,
        "data_resolucao": ch.data_resolucao,
        "esta_finalizado": ch.esta_finalizado,
        "esta_atrasado": ch.esta_atrasado,
        "sem_tecnico": ch.sem_tecnico,
        "is_urgente": ch.is_urgente,
        "tempo_resolucao_horas": ch.tempo_resolucao_horas,
    }


def serial_chamado_lista(ch: Chamado) -> dict:
    """Versão enxuta usada nos cards/listas."""
    return _base_chamado(ch)


def serial_chamado_detalhe(ch: Chamado) -> dict:
    """Versão completa: inclui solução, comentários e histórico."""
    dados = _base_chamado(ch)
    dados.update(
        {
            "solucao_final": ch.solucao_final,
            "comentarios": [serial_comentario(co) for co in ch.comentarios],
            "historico": [serial_historico(h) for h in ch.historico],
        }
    )
    return dados


def opcoes_dict() -> dict:
    """Listas de opções para preencher selects no frontend."""
    return {
        "categorias": [{"valor": v, "label": l} for v, l in c.CATEGORIAS],
        "prioridades": [{"valor": v, "label": l} for v, l in c.PRIORIDADES],
        "status": [{"valor": v, "label": l} for v, l in c.STATUS],
        "locais": [{"valor": v, "label": l} for v, l in c.LOCAIS],
        "tipos_publicos": [{"valor": v, "label": c.LABEL_TIPO[v]} for v in c.TIPOS_PUBLICOS],
    }
