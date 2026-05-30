"""Listas de opções e regras de negócio do domínio.

Centralizadas aqui para que models, schemas, seed e API usem os mesmos
valores. As "cores" seguem os nomes de variante do Bootstrap só por
convenção; o frontend mapeia cada nome para o estilo correspondente.
"""

# ---- Tipos de usuário ----
TIPO_ALUNO = "aluno"
TIPO_PROFESSOR = "professor"
TIPO_FUNCIONARIO = "funcionario"
TIPO_TECNICO = "tecnico"
TIPO_ADMIN = "admin"

TIPOS = [
    (TIPO_ALUNO, "Aluno"),
    (TIPO_PROFESSOR, "Professor"),
    (TIPO_FUNCIONARIO, "Funcionário"),
    (TIPO_TECNICO, "Técnico de Suporte"),
    (TIPO_ADMIN, "Administrador"),
]
# Tipos que podem se cadastrar livremente pela tela pública
TIPOS_PUBLICOS = [TIPO_ALUNO, TIPO_PROFESSOR, TIPO_FUNCIONARIO]

# ---- Categorias ----
CATEGORIAS = [
    ("hardware", "Hardware"),
    ("software", "Software"),
    ("rede", "Rede / Internet"),
    ("projetor", "Projetor / Multimídia"),
    ("sistema", "Sistema Acadêmico"),
    ("laboratorio", "Laboratório"),
    ("impressora", "Impressora"),
    ("outro", "Outro"),
]

# ---- Prioridades + SLA (prazo em horas) ----
PRIORIDADES = [
    ("baixa", "Baixa"),
    ("media", "Média"),
    ("alta", "Alta"),
    ("urgente", "Urgente"),
]
SLA_HORAS = {"baixa": 168, "media": 96, "alta": 48, "urgente": 24}

# ---- Status ----
STATUS = [
    ("aberto", "Aberto"),
    ("analise", "Em análise"),
    ("atendimento", "Em atendimento"),
    ("aguardando", "Aguardando usuário"),
    ("resolvido", "Resolvido"),
    ("cancelado", "Cancelado"),
]
STATUS_FINAIS = ["resolvido", "cancelado"]

# ---- Localizações ----
LOCAIS = [
    ("lab01", "Laboratório 01"),
    ("lab02", "Laboratório 02"),
    ("biblioteca", "Biblioteca"),
    ("secretaria", "Secretaria"),
    ("sala", "Sala de Aula"),
    ("coordenacao", "Coordenação"),
    ("auditorio", "Auditório"),
    ("recepcao", "Recepção"),
    ("outro", "Outro"),
]

# ---- Cores dos badges ----
STATUS_COR = {
    "aberto": "primary",
    "analise": "info",
    "atendimento": "warning",
    "aguardando": "secondary",
    "resolvido": "success",
    "cancelado": "dark",
}
PRIORIDADE_COR = {
    "baixa": "success",
    "media": "info",
    "alta": "warning",
    "urgente": "danger",
}

# Dicionários valor -> rótulo (usados na serialização)
LABEL_TIPO = dict(TIPOS)
LABEL_CATEGORIA = dict(CATEGORIAS)
LABEL_PRIORIDADE = dict(PRIORIDADES)
LABEL_STATUS = dict(STATUS)
LABEL_LOCAL = dict(LOCAIS)
