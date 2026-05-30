"""Popular o banco com dados de demonstração (usuários e chamados fictícios).

Uso (a partir da pasta backend, com a venv ativa e o Postgres no ar):
    python -m app.seed
"""

import random
from datetime import timedelta

from sqlalchemy import or_, text

from .database import SessionLocal, Base, engine
from .models import Chamado, Comentario, Usuario, agora_utc, registrar_historico
from .security import hash_senha
from . import constants as c

USERNAMES_DEMO = ["admin", "tecnico1", "tecnico2", "aluno1", "aluno2", "aluno3", "prof1", "prof2", "func1"]


def _criar_usuario(db, username, senha, nome, email, tipo, setor=""):
    u = Usuario(
        username=username,
        email=email,
        nome_completo=nome,
        senha_hash=hash_senha(senha),
        tipo=tipo,
        setor=setor,
    )
    db.add(u)
    db.flush()
    return u


def _limpar(db):
    print("Limpando dados de demonstração antigos...")
    # apaga chamados (cascateia comentários e histórico) e usuários de demo
    db.query(Chamado).delete()
    db.query(Usuario).filter(Usuario.username.in_(USERNAMES_DEMO)).delete(synchronize_session=False)
    db.commit()


def _criar_chamados(db, admin, tecnicos, comuns):
    agora = agora_utc()

    modelos = [
        ("Computador do Laboratório 01 não liga",
         "A máquina da bancada 3 não dá nenhum sinal ao pressionar o botão de ligar. Já testei outra tomada.",
         "hardware", "alta", "resolvido", "lab01"),
        ("Sem acesso à internet no Laboratório 02",
         "Nenhum computador do laboratório consegue navegar. O cabo de rede parece conectado.",
         "rede", "urgente", "atendimento", "lab02"),
        ("Projetor do auditório sem imagem",
         'O projetor liga mas fica na tela azul "sem sinal" mesmo com o cabo HDMI conectado ao notebook.',
         "projetor", "alta", "analise", "auditorio"),
        ("Sistema acadêmico fora do ar",
         "Não consigo acessar o portal para lançar as notas dos alunos. Aparece erro 500.",
         "sistema", "urgente", "aberto", "coordenacao"),
        ("Impressora da secretaria com atolamento",
         "A impressora multifuncional trava o papel toda vez que tentamos imprimir mais de 2 páginas.",
         "impressora", "media", "resolvido", "secretaria"),
        ("Office não abre nos computadores do laboratório",
         "Ao abrir o Word aparece uma mensagem de erro de licença e o programa fecha sozinho.",
         "software", "media", "atendimento", "lab01"),
        ("Mouse e teclado da recepção não funcionam",
         "Os periféricos pararam de responder. Já troquei as pilhas do mouse sem fio.",
         "hardware", "baixa", "resolvido", "recepcao"),
        ("Wi-Fi da biblioteca muito lento",
         "A conexão cai constantemente e fica impossível pesquisar nos computadores da biblioteca.",
         "rede", "media", "aguardando", "biblioteca"),
        ("Ar-condicionado da sala desligando o disjuntor",
         "Quando ligamos o ar junto com os computadores, o disjuntor da sala cai.",
         "outro", "alta", "aberto", "sala"),
        ("Instalação do Python no Laboratório 02",
         "Preciso que instalem o Python e o VS Code nas máquinas para a disciplina de programação.",
         "software", "media", "resolvido", "lab02"),
        ("Tela do computador piscando",
         "O monitor da bancada 7 fica piscando e às vezes apaga sozinho durante o uso.",
         "hardware", "media", "analise", "lab01"),
        ("Não consigo fazer login no sistema acadêmico",
         "Minha senha não é aceita mesmo digitando corretamente. Já tentei recuperar e não chega o e-mail.",
         "sistema", "alta", "atendimento", "biblioteca"),
        ("Cabo de rede danificado na coordenação",
         "O cabo de rede do computador da coordenação está com o conector quebrado.",
         "rede", "baixa", "resolvido", "coordenacao"),
        ("Computador muito lento para abrir programas",
         "A máquina demora vários minutos para abrir qualquer programa. Pode ser vírus?",
         "hardware", "baixa", "aguardando", "secretaria"),
        ("Projetor da sala 3 com imagem esverdeada",
         "A imagem do projetor está com uma cor esverdeada, atrapalhando a leitura dos slides.",
         "projetor", "media", "aberto", "sala"),
        ("Solicitação de novo software estatístico",
         "Gostaria de solicitar a instalação de um software de estatística para a disciplina de pesquisa.",
         "software", "baixa", "cancelado", "lab02"),
        ("Teclado com teclas travando",
         "Algumas teclas do computador da biblioteca estão travando e dificultando a digitação.",
         "hardware", "baixa", "resolvido", "biblioteca"),
        ("Internet instável no auditório durante evento",
         "Durante a palestra a internet caiu várias vezes, prejudicando a transmissão online.",
         "rede", "alta", "atendimento", "auditorio"),
        ("Impressora sem toner na coordenação",
         "A impressora parou de imprimir e aparece aviso de toner vazio.",
         "impressora", "media", "aberto", "coordenacao"),
        ("Computador não reconhece pendrive",
         "Ao conectar o pendrive nas portas USB nada acontece, em nenhuma das portas.",
         "hardware", "baixa", "resolvido", "lab01"),
        ("Erro ao gerar boletim no sistema",
         "Quando tento gerar o boletim em PDF o sistema apresenta um erro e não conclui.",
         "sistema", "media", "analise", "secretaria"),
        ("Som do auditório não funciona",
         "As caixas de som do auditório não emitem áudio durante as apresentações.",
         "projetor", "alta", "aberto", "auditorio"),
    ]

    solucoes = {
        "Computador do Laboratório 01 não liga": "Fonte de alimentação substituída. Equipamento testado e funcionando normalmente.",
        "Impressora da secretaria com atolamento": "Removido papel preso no mecanismo e feita limpeza dos roletes. Impressão normalizada.",
        "Mouse e teclado da recepção não funcionam": "Substituído o receptor USB sem fio. Periféricos voltaram a responder.",
        "Instalação do Python no Laboratório 02": "Python 3.12 e VS Code instalados em todas as máquinas do laboratório.",
        "Cabo de rede danificado na coordenação": "Cabo de rede trocado e conector recrimpado. Conexão restabelecida.",
        "Teclado com teclas travando": "Teclado substituído por um novo. Problema resolvido.",
        "Computador não reconhece pendrive": "Portas USB reativadas no gerenciador de dispositivos e drivers atualizados.",
    }

    tecnico_idx = 0
    for i, (titulo, desc, cat, pri, status, local) in enumerate(modelos):
        solicitante = comuns[i % len(comuns)]
        ch = Chamado(
            titulo=titulo, descricao=desc, categoria=cat, prioridade=pri,
            status=status, localizacao=local, solicitante_id=solicitante.id,
        )
        db.add(ch)
        db.flush()

        # distribui as aberturas ao longo dos últimos 25 dias
        dias = random.randint(1, 25)
        horas = random.randint(0, 23)
        data_abertura = agora - timedelta(days=dias, hours=horas)
        ch.data_abertura = data_abertura

        registrar_historico(db, ch, solicitante, f"{solicitante.nome} abriu o chamado.")

        # atribui técnico aos que não estão apenas "abertos"
        if status != "aberto":
            tecnico = tecnicos[tecnico_idx % len(tecnicos)]
            tecnico_idx += 1
            ch.tecnico_id = tecnico.id
            registrar_historico(db, ch, tecnico, f"{tecnico.nome} assumiu o chamado como técnico responsável.")
            if i % 2 == 0:
                db.add(Comentario(chamado_id=ch.id, autor_id=tecnico.id,
                                  texto="Recebido. Vou verificar o problema e retorno em breve."))
                registrar_historico(db, ch, tecnico, f"{tecnico.nome} comentou no chamado.")

        # resolvidos ganham data de resolução e solução
        if status == "resolvido":
            tecnico = db.get(Usuario, ch.tecnico_id) if ch.tecnico_id else None
            horas_resolucao = random.randint(2, 40)
            data_resolucao = data_abertura + timedelta(hours=horas_resolucao)
            if data_resolucao > agora:
                data_resolucao = agora - timedelta(hours=1)
            ch.solucao_final = solucoes.get(titulo, "Problema verificado e solucionado pela equipe de suporte.")
            ch.data_resolucao = data_resolucao
            if tecnico:
                registrar_historico(db, ch, tecnico, f"{tecnico.nome} registrou a solução aplicada.")
                registrar_historico(db, ch, tecnico, f'{tecnico.nome} alterou o status para "Resolvido".')

        if status == "cancelado":
            registrar_historico(db, ch, admin, f'{admin.nome} alterou o status para "Cancelado".')

    db.commit()
    print(f"  {len(modelos)} chamados criados.")


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _limpar(db)

        print("Criando usuários...")
        admin = _criar_usuario(db, "admin", "admin123", "Administrador do Sistema",
                               "admin@nassau.edu.br", c.TIPO_ADMIN, setor="TI")
        tecnicos = [
            _criar_usuario(db, "tecnico1", "tecnico123", "Carlos Andrade",
                           "carlos.tecnico@nassau.edu.br", c.TIPO_TECNICO, setor="Suporte de TI"),
            _criar_usuario(db, "tecnico2", "tecnico123", "Beatriz Lima",
                           "beatriz.tecnica@nassau.edu.br", c.TIPO_TECNICO, setor="Suporte de TI"),
        ]
        comuns = [
            _criar_usuario(db, "aluno1", "aluno123", "João Pedro Silva",
                           "joao.silva@aluno.nassau.edu.br", c.TIPO_ALUNO, setor="Ciência da Computação"),
            _criar_usuario(db, "aluno2", "aluno123", "Maria Eduarda Santos",
                           "maria.santos@aluno.nassau.edu.br", c.TIPO_ALUNO, setor="Engenharia"),
            _criar_usuario(db, "aluno3", "aluno123", "Lucas Ferreira",
                           "lucas.ferreira@aluno.nassau.edu.br", c.TIPO_ALUNO, setor="Direito"),
            _criar_usuario(db, "prof1", "prof123", "Prof. Ricardo Mendes",
                           "ricardo.mendes@nassau.edu.br", c.TIPO_PROFESSOR, setor="Departamento de Computação"),
            _criar_usuario(db, "prof2", "prof123", "Profa. Ana Carolina",
                           "ana.carolina@nassau.edu.br", c.TIPO_PROFESSOR, setor="Departamento de Exatas"),
            _criar_usuario(db, "func1", "func123", "Sandra Oliveira",
                           "sandra.oliveira@nassau.edu.br", c.TIPO_FUNCIONARIO, setor="Secretaria Acadêmica"),
        ]
        db.commit()

        print("Criando chamados...")
        _criar_chamados(db, admin, tecnicos, comuns)

        print("\nBanco populado com sucesso!\n")
        print("Usuários de acesso:")
        print("  ADMIN     -> usuário: admin     | senha: admin123")
        print("  TÉCNICO   -> usuário: tecnico1  | senha: tecnico123")
        print("  TÉCNICO   -> usuário: tecnico2  | senha: tecnico123")
        print("  ALUNO     -> usuário: aluno1    | senha: aluno123")
        print("  PROFESSOR -> usuário: prof1     | senha: prof123")
        print("  FUNCION.  -> usuário: func1     | senha: func123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
