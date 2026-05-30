"""Rotas de chamados e do dashboard (com escopo por perfil)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Chamado, Comentario, Usuario, registrar_historico
from ..security import exige_equipe, get_usuario_atual
from ..stats import contagem
from .. import constants as c
from .. import schemas

router = APIRouter(prefix="/api", tags=["chamados"])


# ---------------- utilidades ----------------
def _escopo(db: Session, usuario: Usuario):
    """Queryset base de chamados visíveis conforme o perfil."""
    q = db.query(Chamado)
    if usuario.is_admin:
        return q
    if usuario.is_tecnico:
        return q.filter(or_(Chamado.tecnico_id == usuario.id, Chamado.tecnico_id.is_(None)))
    return q.filter(Chamado.solicitante_id == usuario.id)


def _carregar_detalhe(db: Session, chamado_id: int) -> Chamado:
    ch = (
        db.query(Chamado)
        .options(
            joinedload(Chamado.solicitante),
            joinedload(Chamado.tecnico),
            joinedload(Chamado.comentarios).joinedload(Comentario.autor),
            joinedload(Chamado.historico),
        )
        .filter(Chamado.id == chamado_id)
        .first()
    )
    if ch is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    return ch


def _pode_ver(usuario: Usuario, chamado: Chamado):
    if not usuario.is_equipe and chamado.solicitante_id != usuario.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver este chamado.")


# ---------------- opções p/ selects ----------------
@router.get("/opcoes")
def opcoes(_: Usuario = Depends(get_usuario_atual)):
    return schemas.opcoes_dict()


# ---------------- lista ----------------
@router.get("/chamados")
def listar(
    status: str = "",
    prioridade: str = "",
    categoria: str = "",
    q: str = "",
    ordem: str = "recentes",
    filtro: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=50),
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    consulta = _escopo(db, usuario).options(
        joinedload(Chamado.solicitante), joinedload(Chamado.tecnico)
    )

    if status:
        consulta = consulta.filter(Chamado.status == status)
    if prioridade:
        consulta = consulta.filter(Chamado.prioridade == prioridade)
    if categoria:
        consulta = consulta.filter(Chamado.categoria == categoria)
    if q.strip():
        termo = f"%{q.strip()}%"
        consulta = consulta.filter(or_(Chamado.titulo.ilike(termo), Chamado.descricao.ilike(termo)))

    # filtros rápidos
    if filtro == "urgentes":
        consulta = consulta.filter(Chamado.prioridade == "urgente")
    elif filtro == "abertos":
        consulta = consulta.filter(~Chamado.status.in_(c.STATUS_FINAIS))
    elif filtro == "sem_tecnico" and usuario.is_equipe:
        consulta = consulta.filter(Chamado.tecnico_id.is_(None))
    elif filtro == "meus":
        if usuario.is_equipe:
            consulta = consulta.filter(Chamado.tecnico_id == usuario.id)
        else:
            consulta = consulta.filter(Chamado.solicitante_id == usuario.id)

    ordens = {
        "recentes": Chamado.data_abertura.desc(),
        "antigos": Chamado.data_abertura.asc(),
        "atualizado": Chamado.data_atualizacao.desc(),
    }
    consulta = consulta.order_by(ordens.get(ordem, Chamado.data_abertura.desc()))

    total = consulta.count()
    itens = consulta.offset((page - 1) * page_size).limit(page_size).all()
    paginas = max((total + page_size - 1) // page_size, 1)

    return {
        "itens": [schemas.serial_chamado_lista(ch) for ch in itens],
        "total": total,
        "page": page,
        "pages": paginas,
        "page_size": page_size,
    }


# ---------------- criar ----------------
@router.post("/chamados", status_code=201)
def criar(
    dados: schemas.ChamadoCreateIn,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    chamado = Chamado(
        titulo=dados.titulo,
        descricao=dados.descricao,
        categoria=dados.categoria,
        prioridade=dados.prioridade,
        localizacao=dados.localizacao,
        status="aberto",
        solicitante_id=usuario.id,
    )
    db.add(chamado)
    db.flush()  # garante o id antes de registrar histórico
    registrar_historico(db, chamado, usuario, f"{usuario.nome} abriu o chamado.")
    db.commit()
    return _detalhe_resposta(db, chamado.id, usuario)


# ---------------- detalhe ----------------
@router.get("/chamados/{chamado_id}")
def detalhe(
    chamado_id: int,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    return _detalhe_resposta(db, chamado_id, usuario)


def _detalhe_resposta(db: Session, chamado_id: int, usuario: Usuario):
    ch = _carregar_detalhe(db, chamado_id)
    _pode_ver(usuario, ch)
    return schemas.serial_chamado_detalhe(ch)


# ---------------- comentar ----------------
@router.post("/chamados/{chamado_id}/comentar")
def comentar(
    chamado_id: int,
    dados: schemas.ComentarioIn,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    ch = _carregar_detalhe(db, chamado_id)
    _pode_ver(usuario, ch)

    db.add(Comentario(chamado_id=ch.id, autor_id=usuario.id, texto=dados.texto))
    registrar_historico(db, ch, usuario, f"{usuario.nome} comentou no chamado.")
    db.commit()
    return _detalhe_resposta(db, chamado_id, usuario)


# ---------------- assumir (equipe) ----------------
@router.post("/chamados/{chamado_id}/assumir")
def assumir(
    chamado_id: int,
    usuario: Usuario = Depends(exige_equipe),
    db: Session = Depends(get_db),
):
    ch = _carregar_detalhe(db, chamado_id)
    ch.tecnico_id = usuario.id
    if ch.status == "aberto":
        ch.status = "atendimento"
    registrar_historico(db, ch, usuario, f"{usuario.nome} assumiu o chamado como técnico responsável.")
    db.commit()
    return _detalhe_resposta(db, chamado_id, usuario)


# ---------------- gerenciar (equipe) ----------------
@router.patch("/chamados/{chamado_id}/gerenciar")
def gerenciar(
    chamado_id: int,
    dados: schemas.GerenciarIn,
    usuario: Usuario = Depends(exige_equipe),
    db: Session = Depends(get_db),
):
    ch = _carregar_detalhe(db, chamado_id)

    # valida técnico informado (precisa ser equipe)
    novo_tecnico = None
    if dados.tecnico_id is not None:
        novo_tecnico = db.get(Usuario, dados.tecnico_id)
        if not novo_tecnico or not novo_tecnico.is_equipe:
            raise HTTPException(status_code=400, detail="Técnico responsável inválido.")

    antigo = {
        "status": ch.status,
        "prioridade": ch.prioridade,
        "tecnico_id": ch.tecnico_id,
        "solucao": ch.solucao_final,
    }

    ch.status = dados.status
    ch.prioridade = dados.prioridade
    ch.tecnico_id = dados.tecnico_id
    ch.solucao_final = dados.solucao_final or ""

    # ajusta a data de resolução conforme o status
    if ch.status == "resolvido" and not ch.data_resolucao:
        ch.data_resolucao = datetime.now(timezone.utc)
    if ch.status != "resolvido":
        ch.data_resolucao = None

    nome = usuario.nome
    if ch.status != antigo["status"]:
        registrar_historico(db, ch, usuario,
                            f'{nome} alterou o status para "{c.LABEL_STATUS[ch.status]}".')
    if ch.prioridade != antigo["prioridade"]:
        registrar_historico(db, ch, usuario,
                            f'{nome} alterou a prioridade para "{c.LABEL_PRIORIDADE[ch.prioridade]}".')
    if ch.tecnico_id != antigo["tecnico_id"]:
        if novo_tecnico:
            registrar_historico(db, ch, usuario, f"{nome} definiu {novo_tecnico.nome} como técnico responsável.")
        else:
            registrar_historico(db, ch, usuario, f"{nome} removeu o técnico responsável.")
    if ch.solucao_final and ch.solucao_final != antigo["solucao"]:
        registrar_historico(db, ch, usuario, f"{nome} registrou a solução aplicada.")

    db.commit()
    return _detalhe_resposta(db, chamado_id, usuario)


# ---------------- dashboard ----------------
@router.get("/dashboard")
def dashboard(
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    if usuario.is_admin:
        return _dash_admin(db)
    if usuario.is_tecnico:
        return _dash_tecnico(db, usuario)
    return _dash_comum(db, usuario)


def _nao_final():
    return ~Chamado.status.in_(c.STATUS_FINAIS)


def _dash_admin(db: Session):
    todos = db.query(Chamado).options(
        joinedload(Chamado.solicitante), joinedload(Chamado.tecnico)
    ).all()
    abertos = [ch for ch in todos if not ch.esta_finalizado]
    recentes = sorted(todos, key=lambda x: x.data_abertura, reverse=True)[:6]

    tecnicos = (
        db.query(Usuario)
        .filter(or_(Usuario.tipo == c.TIPO_TECNICO, Usuario.tipo == c.TIPO_ADMIN))
        .all()
    )
    top = []
    for u in tecnicos:
        atendidos = sum(1 for ch in todos if ch.tecnico_id == u.id and ch.status == "resolvido")
        top.append({"nome": u.nome, "atendidos": atendidos})
    top = sorted(top, key=lambda x: x["atendidos"], reverse=True)[:5]

    return {
        "perfil": "admin",
        "total": len(todos),
        "abertos": len(abertos),
        "urgentes": sum(1 for ch in abertos if ch.prioridade == "urgente"),
        "resolvidos": sum(1 for ch in todos if ch.status == "resolvido"),
        "por_categoria": contagem(todos, "categoria", c.CATEGORIAS),
        "por_status": contagem(todos, "status", c.STATUS),
        "recentes": [schemas.serial_chamado_lista(ch) for ch in recentes],
        "tecnicos_top": top,
    }


def _dash_tecnico(db: Session, usuario: Usuario):
    agora = datetime.now(timezone.utc)
    meus = (
        db.query(Chamado)
        .options(joinedload(Chamado.solicitante))
        .filter(Chamado.tecnico_id == usuario.id)
        .all()
    )
    meus_abertos = [ch for ch in meus if not ch.esta_finalizado]
    resolvidos_mes = [
        ch for ch in meus
        if ch.status == "resolvido" and ch.data_resolucao
        and ch.data_resolucao.year == agora.year and ch.data_resolucao.month == agora.month
    ]

    sem_tecnico_q = (
        db.query(Chamado)
        .options(joinedload(Chamado.solicitante))
        .filter(Chamado.tecnico_id.is_(None), _nao_final())
        .order_by(Chamado.data_abertura.desc())
        .all()
    )

    return {
        "perfil": "tecnico",
        "atribuidos": len(meus_abertos),
        "urgentes": sum(1 for ch in meus_abertos if ch.prioridade == "urgente"),
        "em_atendimento": sum(1 for ch in meus if ch.status == "atendimento"),
        "resolvidos_mes": len(resolvidos_mes),
        "sem_tecnico": len(sem_tecnico_q),
        "fila": [schemas.serial_chamado_lista(ch) for ch in sem_tecnico_q[:6]],
        "meus_recentes": [
            schemas.serial_chamado_lista(ch)
            for ch in sorted(meus_abertos, key=lambda x: x.data_abertura, reverse=True)[:6]
        ],
    }


def _dash_comum(db: Session, usuario: Usuario):
    meus = (
        db.query(Chamado)
        .options(joinedload(Chamado.tecnico))
        .filter(Chamado.solicitante_id == usuario.id)
        .all()
    )
    em_andamento = [ch for ch in meus if ch.status in ("analise", "atendimento", "aguardando")]
    return {
        "perfil": "comum",
        "abertos": sum(1 for ch in meus if ch.status == "aberto"),
        "em_andamento": len(em_andamento),
        "resolvidos": sum(1 for ch in meus if ch.status == "resolvido"),
        "total": len(meus),
        "ultimos": [
            schemas.serial_chamado_lista(ch)
            for ch in sorted(meus, key=lambda x: x.data_abertura, reverse=True)[:6]
        ],
    }
