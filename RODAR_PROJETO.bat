@echo off
REM ============================================================
REM  HelpDesk Nassau - inicializador automatico para Windows
REM  Abre 3 janelas: Banco (Docker), Backend (FastAPI) e Frontend (React).
REM  Basta dar duplo-clique neste arquivo.
REM ============================================================

cd /d "%~dp0"

echo.
echo   Iniciando o HelpDesk Nassau...
echo   Vao abrir 3 janelas: banco, backend e frontend.
echo.

REM ---------- 1) BANCO DE DADOS (PostgreSQL via Docker) ----------
REM  Se voce NAO usa Docker (rodando PostgreSQL nativo), pode fechar
REM  esta janela do banco - o backend conecta no PostgreSQL local mesmo assim.
start "HelpDesk - Banco (Docker)" /D "%~dp0" cmd /k "docker compose up -d && docker compose ps && echo. && echo Banco no ar em localhost:5432. Pode minimizar esta janela."

REM  Espera alguns segundos pro banco subir antes do backend conectar.
timeout /t 6 /nobreak >nul

REM ---------- 2) BACKEND (FastAPI) ----------
REM  Cria a venv na primeira vez, instala dependencias, popula o banco e sobe a API.
start "HelpDesk - Backend (API)" /D "%~dp0backend" cmd /k "(if not exist .venv python -m venv .venv) && call .venv\Scripts\activate && pip install -r requirements.txt && python -m app.seed && uvicorn app.main:app --reload --port 8000"

REM ---------- 3) FRONTEND (React + Vite) ----------
start "HelpDesk - Frontend (Web)" /D "%~dp0frontend" cmd /k "npm install && npm run dev"

echo.
echo   Tudo iniciado!
echo     - API:   http://localhost:8000   (documentacao em /docs)
echo     - Site:  http://localhost:5173
echo.
echo   Para parar: feche as 3 janelas (ou Ctrl+C em cada uma).
echo   Para parar o banco do Docker: docker compose down
echo.
pause
