"""Rotas do painel administrativo e dos relatórios."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Chamado, Usuario, registrar_historico
from ..security import exige_admin, exige_equipe
from ..stats import contagem
from .. import constants as c
from .. import schemas

router = APIRouter(prefix="/api", tags=["painel"])


# ---------------- painel (somente admin) ----------------
@router.get("/painel")
def painel(_: Usuario = Depends(exige_admin), db: Session = Depends(get_db)):
    todos = (
        db.query(Chamado)
        .options(joinedload(Chamado.solicitante), joinedload(Chamado.tecnico))
        .order_by(Chamado.data_abertura.desc())
        .all()
    )
    abertos = [ch for ch in todos if not ch.esta_finalizado]

    tecnicos = (
        db.query(Usuario)
        .filter(or_(Usuario.tipo == c.TIPO_TECNICO, Usuario.tipo == c.TIPO_ADMIN))
        .order_by(Usuario.nome_completo, Usuario.username)
        .all()
    )
    # carga = chamados não finalizados atribuídos a cada técnico
    tecnicos_dados = []
    for u in tecnicos:
        carga = sum(1 for ch in todos if ch.tecnico_id == u.id and not ch.esta_finalizado)
        d = schemas.serial_usuario_mini(u)
        d["carga"] = carga
        tecnicos_dados.append(d)

    usuarios = db.query(Usuario).order_by(Usuario.criado_em.desc()).limit(30).all()

    return {
        "total": len(todos),
        "abertos": len(abertos),
        "urgentes": sum(1 for ch in abertos if ch.prioridade == "urgente"),
        "resolvidos": sum(1 for ch in todos if ch.status == "resolvido"),
        "sem_tecnico": sum(1 for ch in abertos if ch.tecnico_id is None),
        "chamados": [schemas.serial_chamado_lista(ch) for ch in todos[:25]],
        "tecnicos": tecnicos_dados,
        "usuarios": [schemas.serial_usuario(u) for u in usuarios],
    }


@router.post("/painel/atualizar")
def painel_atualizar(
    dados: schemas.PainelUpdateIn,
    usuario: Usuario = Depends(exige_admin),
    db: Session = Depends(get_db),
):
    ch = db.get(Chamado, dados.chamado_id)
    if ch is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")

    nome = usuario.nome
    mudou = False

    if dados.status and dados.status != ch.status:
        if dados.status not in c.LABEL_STATUS:
            raise HTTPException(status_code=400, detail="Status inválido.")
        ch.status = dados.status
        if ch.status == "resolvido" and not ch.data_resolucao:
            ch.data_resolucao = datetime.now(timezone.utc)
        if ch.status != "resolvido":
            ch.data_resolucao = None
        registrar_historico(db, ch, usuario,
                            f'{nome} alterou o status para "{c.LABEL_STATUS[ch.status]}" pelo painel.')
        mudou = True

    if dados.tecnico_id != ch.tecnico_id:
        novo = None
        if dados.tecnico_id is not None:
            novo = db.get(Usuario, dados.tecnico_id)
            if not novo or not novo.is_equipe:
                raise HTTPException(status_code=400, detail="Técnico inválido.")
        ch.tecnico_id = dados.tecnico_id
        if novo:
            registrar_historico(db, ch, usuario, f"{nome} atribuiu {novo.nome} ao chamado pelo painel.")
        else:
            registrar_historico(db, ch, usuario, f"{nome} removeu o técnico pelo painel.")
        mudou = True

    db.commit()
    return {"ok": True, "mudou": mudou, "chamado_id": ch.id}


# ---------------- relatórios (equipe) ----------------
@router.get("/relatorios")
def relatorios(_: Usuario = Depends(exige_equipe), db: Session = Depends(get_db)):
    todos = (
        db.query(Chamado)
        .options(joinedload(Chamado.solicitante), joinedload(Chamado.tecnico))
        .all()
    )
    resolvidos = [ch for ch in todos if ch.status == "resolvido" and ch.data_resolucao]

    tempos = [ch.tempo_resolucao_horas for ch in resolvidos if ch.tempo_resolucao_horas is not None]
    tempo_medio = round(sum(tempos) / len(tempos), 1) if tempos else None

    resolvidos_ordenados = sorted(resolvidos, key=lambda x: x.data_resolucao, reverse=True)[:10]

    return {
        "total": len(todos),
        "por_categoria": contagem(todos, "categoria", c.CATEGORIAS),
        "por_status": contagem(todos, "status", c.STATUS),
        "por_prioridade": contagem(todos, "prioridade", c.PRIORIDADES),
        "resolvidos_recentes": [schemas.serial_chamado_lista(ch) for ch in resolvidos_ordenados],
        "tempo_medio": tempo_medio,
        "qtd_resolvidos": len(resolvidos),
        "gerado_em": datetime.now(timezone.utc),
    }
