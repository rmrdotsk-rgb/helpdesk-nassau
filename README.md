# HelpDesk Nassau

Sistema de chamados técnicos para o ambiente acadêmico (laboratórios, salas, secretaria, etc.).
Projeto da faculdade reescrito em três camadas separadas:

- **Banco de dados:** PostgreSQL 16 rodando em **Docker**
- **Backend:** API REST em **Python + FastAPI**
- **Frontend:** **React** (SPA) com Vite

São três perfis de acesso (usuário comum, técnico e administrador), cada um com sua própria
visão do sistema. Tem abertura de chamado, comentários, histórico de tudo que acontece no
chamado (timeline), controle de SLA, painel do admin e relatórios com tempo médio de resolução.

---

## O que você precisa ter instalado (Windows)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o banco)
- [Python 3.11+](https://www.python.org/downloads/) (marque "Add Python to PATH" na instalação)
- [Node.js LTS](https://nodejs.org/) (versão 18 ou 20)

Para conferir se está tudo ok, abra o **PowerShell** e rode:

```powershell
docker --version
python --version
node --version
npm --version
```

---

## Passo a passo para rodar

São 3 terminais: um para o banco, um para o backend e um para o frontend.

### 1) Banco de dados (Docker)

Na pasta raiz do projeto (onde está o `docker-compose.yml`):

```powershell
docker compose up -d
```

Isso baixa e sobe o PostgreSQL na porta 5432. Para conferir se subiu:

```powershell
docker compose ps
```

> O banco `helpdesk_nassau`, o usuário `helpdesk` e a senha `helpdesk` são criados
> automaticamente pelo Docker. Você não precisa criar nada na mão.

### 2) Backend (FastAPI)

Abra um **novo terminal** na pasta `backend`:

```powershell
cd backend

# cria o ambiente virtual
python -m venv .venv

# ativa o ambiente virtual (PowerShell)
.\.venv\Scripts\Activate.ps1

# instala as dependencias
pip install -r requirements.txt

# popula o banco com dados de demonstracao (usuarios e chamados)
python -m app.seed

# sobe a API
uvicorn app.main:app --reload --port 8000
```

> **Se o PowerShell bloquear a ativação** (mensagem sobre "scripts desabilitados"),
> rode uma vez no mesmo terminal e tente ativar de novo:
>
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
> ```
>
> Isso vale só para a janela atual e não altera nada permanentemente.
> Quem prefere o **CMD** (Prompt de Comando) pode usar `.venv\Scripts\activate` no lugar.

A API fica em `http://localhost:8000`. A documentação automática do FastAPI fica em
`http://localhost:8000/docs`.

> O arquivo `.env` já vem pronto apontando para o banco do Docker. Se quiser, dá para
> copiar o `.env.example` e ajustar.

### 3) Frontend (React)

Abra um **terceiro terminal** na pasta `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

O site abre em `http://localhost:5173`. As chamadas para `/api` são redirecionadas
automaticamente para o backend na porta 8000 (configurado no `vite.config.js`), então
não tem problema de CORS no desenvolvimento.

---

## Usuários de demonstração

O `python -m app.seed` cria estes acessos:

| Perfil          | Usuário    | Senha        |
|-----------------|------------|--------------|
| Administrador   | `admin`    | `admin123`   |
| Técnico         | `tecnico1` | `tecnico123` |
| Técnico         | `tecnico2` | `tecnico123` |
| Aluno           | `aluno1`   | `aluno123`   |
| Aluno           | `aluno2`   | `aluno123`   |
| Aluno           | `aluno3`   | `aluno123`   |
| Professor       | `prof1`    | `prof123`    |
| Professor       | `prof2`    | `prof123`    |
| Funcionário     | `func1`    | `func123`    |

Também dá para criar uma conta nova na tela de cadastro (só como aluno, professor ou
funcionário — técnico e admin são criados internamente).

---

## Estrutura do projeto

```
helpdesk-nassau/
├── docker-compose.yml      # sobe o PostgreSQL
├── backend/
│   ├── app/
│   │   ├── main.py         # aplicacao FastAPI + CORS + rotas
│   │   ├── config.py       # le o .env
│   │   ├── database.py     # conexao SQLAlchemy
│   │   ├── models.py       # tabelas: usuarios, chamados, comentarios, historico
│   │   ├── schemas.py      # validacao de entrada e serializacao de saida
│   │   ├── security.py     # senha (bcrypt) + token JWT + permissoes
│   │   ├── constants.py    # categorias, prioridades, status, SLA...
│   │   ├── stats.py        # contagem para as barras dos relatorios
│   │   ├── seed.py         # popula o banco
│   │   └── routers/        # auth, usuarios, chamados, painel
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── pages/          # Login, Dashboard, ListaChamados, DetalheChamado...
    │   ├── components/     # Navbar, Layout, ui, Icone
    │   ├── api.js          # cliente HTTP + token
    │   └── auth.jsx        # contexto de autenticacao
    ├── public/fonts/       # fontes locais (funciona offline)
    └── vite.config.js
```

---

## Como funciona o banco geográfico... não funciona

Só pra deixar claro: este projeto **não** é de banco de dados geográfico. Não usa PostGIS,
nem coordenadas, nem consulta espacial. A "localização" do chamado é só uma lista fixa de
lugares da faculdade (Laboratório 01, Biblioteca, etc.), guardada como texto. É um sistema
de helpdesk comum, com PostgreSQL relacional puro.

---

## Rodar SEM Docker (opcional)

Quem não quiser usar Docker pode rodar o banco com **PostgreSQL nativo no Windows**.
Não precisa mexer em nenhum arquivo de código nem instalar dependência nova — o driver
já está no `requirements.txt` e o `.env` continua igual.

1. Instale o [PostgreSQL para Windows](https://www.postgresql.org/download/windows/)
   (durante a instalação, defina uma senha para o usuário `postgres` e deixe a porta `5432`).
2. Abra o **SQL Shell (psql)** ou o **pgAdmin** e crie o banco e o usuário que o projeto espera:

   ```sql
   CREATE USER helpdesk WITH PASSWORD 'helpdesk';
   CREATE DATABASE helpdesk_nassau OWNER helpdesk;
   ```

3. Pronto. Pule o passo do `docker compose up -d` e siga direto para o **Backend** e o
   **Frontend**. Como o `.env` já aponta para `localhost:5432`, o `python -m app.seed`
   e o `uvicorn` funcionam sem alterar nada.

> **Prefere MySQL?** Também dá, mas exige uma troca de driver (instalar `pymysql` e ajustar
> a `DATABASE_URL` no `.env`). É uma mudança estrutural pequena, porém de banco — se quiser
> esse caminho, é só pedir que eu preparo o `.env` e o `requirements.txt` certos.

---

## Parar tudo

- Backend e frontend: `Ctrl + C` em cada terminal.
- Banco: `docker compose down` (os dados continuam salvos). Para apagar os dados também,
  use `docker compose down -v`.

---

## Detalhes técnicos

- Autenticação por **JWT** (token no `localStorage`, enviado no header `Authorization`).
- Senhas com **bcrypt**.
- O **SLA** (prazo) é calculado por prioridade: urgente 24h, alta 48h, média 96h, baixa 168h.
  Chamados que passam do prazo aparecem marcados como "atrasado".
- O **histórico** registra automaticamente abertura, comentários, troca de status,
  de prioridade, de técnico e a solução.
- O escopo de visibilidade muda por perfil: aluno vê só os próprios chamados, técnico vê os
  dele mais a fila sem responsável, e admin vê tudo.
