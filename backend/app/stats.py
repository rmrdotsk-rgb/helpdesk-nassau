"""Função de apoio para montar dados de barras (contagem + percentual)."""


def contagem(itens, attr, choices):
    """Retorna [{'label','chave','valor','pct'}] com pct relativo ao maior valor."""
    brutos = {}
    for it in itens:
        v = getattr(it, attr)
        brutos[v] = brutos.get(v, 0) + 1

    dados = [{"label": label, "chave": chave, "valor": brutos.get(chave, 0)}
             for chave, label in choices]
    maior = max((d["valor"] for d in dados), default=0) or 1
    for d in dados:
        d["pct"] = max(round(d["valor"] / maior * 100), 3) if d["valor"] else 0
    return dados
