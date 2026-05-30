"""Modelos do banco de dados (SQLAlchemy ORM).

Unificamos o User + Perfil do projeto antigo em uma única tabela `usuarios`,
o que simplifica a API. As relações entre chamado, comentários e histórico
são as mesmas do projeto original.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base
from . import constants as c


def agora_utc() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    email = Column(String(254), unique=True, nullable=False, index=True)
    nome_completo = Column(String(150), nullable=False, default="")
    senha_hash = Column(String(255), nullable=False)
    tipo = Column(String(20), nullable=False, default=c.TIPO_ALUNO)
    telefone = Column(String(20), nullable=False, default="")
    setor = Column(String(80), nullable=False, default="")
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), default=agora_utc)

    chamados_abertos = relationship(
        "Chamado", back_populates="solicitante", foreign_keys="Chamado.solicitante_id"
    )
    chamados_atribuidos = relationship(
        "Chamado", back_populates="tecnico", foreign_keys="Chamado.tecnico_id"
    )

    # ---- atalhos de permissão ----
    @property
    def is_admin(self) -> bool:
        return self.tipo == c.TIPO_ADMIN

    @property
    def is_tecnico(self) -> bool:
        return self.tipo == c.TIPO_TECNICO

    @property
    def is_equipe(self) -> bool:
        """Equipe de suporte = técnico ou administrador."""
        return self.tipo in (c.TIPO_TECNICO, c.TIPO_ADMIN)

    @property
    def is_comum(self) -> bool:
        return self.tipo in c.TIPOS_PUBLICOS

    @property
    def nome(self) -> str:
        return self.nome_completo or self.username


class Chamado(Base):
    __tablename__ = "chamados"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(120), nullable=False)
    descricao = Column(Text, nullable=False)
    categoria = Column(String(20), nullable=False, default="outro")
    prioridade = Column(String(10), nullable=False, default="media")
    status = Column(String(15), nullable=False, default="aberto")
    localizacao = Column(String(20), nullable=False, default="outro")

    solicitante_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    tecnico_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    data_abertura = Column(DateTime(timezone=True), default=agora_utc, index=True)
    data_atualizacao = Column(DateTime(timezone=True), default=agora_utc, onupdate=agora_utc)
    data_resolucao = Column(DateTime(timezone=True), nullable=True)

    solucao_final = Column(Text, nullable=False, default="")

    solicitante = relationship("Usuario", back_populates="chamados_abertos", foreign_keys=[solicitante_id])
    tecnico = relationship("Usuario", back_populates="chamados_atribuidos", foreign_keys=[tecnico_id])
    comentarios = relationship(
        "Comentario", back_populates="chamado", cascade="all, delete-orphan", order_by="Comentario.criado_em"
    )
    historico = relationship(
        "Historico", back_populates="chamado", cascade="all, delete-orphan", order_by="Historico.criado_em"
    )

    # ---- estados derivados ----
    @property
    def esta_finalizado(self) -> bool:
        return self.status in c.STATUS_FINAIS

    @property
    def sem_tecnico(self) -> bool:
        return self.tecnico_id is None

    @property
    def is_urgente(self) -> bool:
        return self.prioridade == "urgente"

    @property
    def esta_atrasado(self) -> bool:
        """Passou do prazo de SLA e ainda não foi finalizado."""
        if self.esta_finalizado or self.data_abertura is None:
            return False
        limite = self.data_abertura + timedelta(hours=c.SLA_HORAS.get(self.prioridade, 96))
        return agora_utc() > limite

    @property
    def tempo_resolucao_horas(self):
        """Horas entre abertura e resolução (None se ainda não resolvido)."""
        if self.data_resolucao and self.data_abertura:
            delta = self.data_resolucao - self.data_abertura
            return round(delta.total_seconds() / 3600, 1)
        return None


class Comentario(Base):
    __tablename__ = "comentarios"

    id = Column(Integer, primary_key=True, index=True)
    chamado_id = Column(Integer, ForeignKey("chamados.id", ondelete="CASCADE"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    texto = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), default=agora_utc)

    chamado = relationship("Chamado", back_populates="comentarios")
    autor = relationship("Usuario")


class Historico(Base):
    __tablename__ = "historico"

    id = Column(Integer, primary_key=True, index=True)
    chamado_id = Column(Integer, ForeignKey("chamados.id", ondelete="CASCADE"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(255), nullable=False)
    criado_em = Column(DateTime(timezone=True), default=agora_utc)

    chamado = relationship("Chamado", back_populates="historico")
    autor = relationship("Usuario")


def registrar_historico(db, chamado: "Chamado", autor: "Usuario", acao: str) -> "Historico":
    """Atalho para criar uma entrada no histórico de um chamado."""
    h = Historico(chamado_id=chamado.id, autor_id=autor.id if autor else None, acao=acao)
    db.add(h)
    return h
