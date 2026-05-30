from fastapi import FastAPI, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi.errors import RateLimitExceeded
import sqlite3
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
import os

from schemas import LeituraIn, LeituraOut, PrevisaoOut, EstatisticasOut, HealthOut
from errors import register_error_handlers, problem_response
from ratelimit import limiter, rate_limit_exceeded_handler

# ─── Configuração da aplicação ───────────────────────────────────────────────

app = FastAPI(
    title="Smart Building API",
    description=(
        "API REST para monitoramento de ambiente com sensores simulados (PIR e DHT11), "
        "predição de consumo energético via modelo de regressão linear e detecção "
        "de anomalias. Projeto integrador — Expo Tech 2026 UniFECAF."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS — restringido aos domínios conhecidos do frontend em produção
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://smartbuilding-frontend.onrender.com,http://localhost:3000,http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
    max_age=600,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Handlers de erro padronizados (RFC 7807)
register_error_handlers(app)


# ─── Banco de dados ──────────────────────────────────────────────────────────

DB_PATH = os.environ.get("DB_PATH", "smartbuilding.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                ts              TEXT    NOT NULL,
                people          INTEGER NOT NULL,
                temperature     REAL    NOT NULL,
                light           TEXT    NOT NULL,
                ac              TEXT    NOT NULL,
                consumption     INTEGER NOT NULL,
                idempotency_key TEXT    UNIQUE
            )
        """)
        # índice para acelerar buscas por chave de idempotência
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_idem ON readings(idempotency_key)"
        )
        conn.commit()


init_db()


# ─── Modelo de Machine Learning ──────────────────────────────────────────────

class EnergyModel:

    def __init__(self):
        self.reg = LinearRegression()
        self.trained = False
        self.training_samples = 0
        self._treinar_sintetico()

    def _treinar_sintetico(self):
        # gera dados sintéticos que replicam a física da simulação
        rng = np.random.default_rng(42)
        n = 600

        pessoas = rng.integers(0, 11, n).astype(float)
        temps   = 22.0 + pessoas * 0.5 + rng.normal(0, 1.5, n)
        temps   = np.clip(temps, 16.0, 40.0)

        consumo = np.where(pessoas > 0, 100.0, 0.0)
        consumo = np.where(temps > 28, consumo + 1500.0, consumo)
        consumo = np.where((temps > 24) & (temps <= 28), consumo + 800.0, consumo)
        consumo += rng.normal(0, 45, n)
        consumo  = np.clip(consumo, 0, 1700)

        X = np.column_stack([pessoas, temps])
        self.reg.fit(X, consumo)
        self.trained = True
        self.training_samples = n

    def retreinar(self, rows):
        if len(rows) < 15:
            return
        X = np.array([[r["people"], r["temperature"]] for r in rows])
        y = np.array([r["consumption"] for r in rows])
        self.reg.fit(X, y)
        self.training_samples = len(rows)

    def prever(self, pessoas: int, temperatura: float) -> dict:
        X = np.array([[float(pessoas), float(temperatura)]])
        pred = float(self.reg.predict(X)[0])
        pred = max(0.0, min(1700.0, pred))

        baseline = 1600.0
        economia = round((1.0 - pred / baseline) * 100.0, 1)

        return {
            "predicted_consumption_w": round(pred),
            "baseline_w":              int(baseline),
            "predicted_saving_pct":    max(0.0, economia),
            "coef_people":             round(float(self.reg.coef_[0]), 2),
            "coef_temp":               round(float(self.reg.coef_[1]), 2),
            "training_samples":        self.training_samples,
        }

    def anomalia(self, real: int, pessoas: int, temperatura: float) -> float:
        pred = self.prever(pessoas, temperatura)["predicted_consumption_w"]
        if pred == 0 and real == 0:
            return 0.0
        denominador = max(pred, real, 1)
        return round(abs(real - pred) / denominador * 100.0, 1)


model = EnergyModel()


# ─── Headers utilitários ─────────────────────────────────────────────────────

def no_store_headers() -> dict:
    # dados que mudam a cada leitura não devem ser cacheados
    return {"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}


def short_cache_headers(seconds: int = 30) -> dict:
    # dados agregados podem ser cacheados por tempo curto
    return {"Cache-Control": f"public, max-age={seconds}"}


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthOut,
    summary="Health check",
    description="Retorna o status do serviço e do modelo de ML carregado em memória.",
    tags=["system"],
)
def health():
    return HealthOut(
        status="ok",
        model_trained=model.trained,
        training_samples=model.training_samples,
    )


@app.post(
    "/v1/readings",
    response_model=LeituraOut,
    status_code=status.HTTP_201_CREATED,
    summary="Armazena leitura dos sensores",
    description=(
        "Recebe uma leitura dos sensores simulados (PIR e DHT11) e a persiste no banco. "
        "Calcula o score de anomalia comparando o consumo informado com o consumo "
        "predito pelo modelo. Aceita header opcional `Idempotency-Key` para evitar "
        "duplicação em caso de retry."
    ),
    tags=["readings"],
    responses={
        201: {"description": "Leitura armazenada com sucesso"},
        422: {"description": "Validação falhou — corpo inválido"},
        429: {"description": "Rate limit excedido"},
    },
)
@limiter.limit("120/minute")
def salvar_leitura(request: Request, r: LeituraIn):
    chave = request.headers.get("Idempotency-Key")

    # se uma chave de idempotência foi enviada, verifica se já existe
    if chave:
        with get_db() as conn:
            existente = conn.execute(
                "SELECT id, people, temperature, consumption FROM readings "
                "WHERE idempotency_key = ?",
                (chave,),
            ).fetchone()
        if existente:
            score = model.anomalia(
                existente["consumption"],
                existente["people"],
                existente["temperature"],
            )
            return JSONResponse(
                status_code=200,
                content=LeituraOut(
                    ok=True,
                    total_readings=existente["id"],
                    anomaly_score=score,
                    anomaly_flag=score > 40.0,
                ).model_dump(),
                headers=no_store_headers(),
            )

    with get_db() as conn:
        conn.execute(
            "INSERT INTO readings (ts, people, temperature, light, ac, consumption, idempotency_key) "
            "VALUES (?,?,?,?,?,?,?)",
            (datetime.utcnow().isoformat(),
             r.peopleCount, r.temperature,
             r.lightStatus, r.acStatus, r.consumption, chave),
        )
        conn.commit()
        total = conn.execute("SELECT COUNT(*) FROM readings").fetchone()[0]

    # retreina o modelo a cada 30 novas leituras
    if total % 30 == 0:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT people, temperature, consumption FROM readings "
                "ORDER BY id DESC LIMIT 400"
            ).fetchall()
        model.retreinar(rows)

    score = model.anomalia(r.consumption, r.peopleCount, r.temperature)

    return JSONResponse(
        status_code=201,
        content=LeituraOut(
            ok=True,
            total_readings=total,
            anomaly_score=score,
            anomaly_flag=score > 40.0,
        ).model_dump(),
        headers=no_store_headers(),
    )


@app.get(
    "/v1/predictions",
    response_model=PrevisaoOut,
    summary="Predição de consumo energético",
    description=(
        "Retorna a predição de consumo (em watts) calculada pelo modelo de regressão "
        "linear, dado o número de pessoas na sala e a temperatura ambiente. "
        "Não cacheável — sempre reflete o estado atual do modelo."
    ),
    tags=["predictions"],
    responses={
        200: {"description": "Predição calculada"},
        422: {"description": "Parâmetros fora dos limites válidos"},
        429: {"description": "Rate limit excedido"},
    },
)
@limiter.limit("300/minute")
def prever(
    request: Request,
    people: int = Query(..., ge=0, le=10, description="Número de pessoas na sala (0 a 10)"),
    temperature: float = Query(..., ge=16, le=40, description="Temperatura em °C (16 a 40)"),
):
    resultado = model.prever(people, temperature)
    resultado["model_type"] = "LinearRegression"
    resultado["features"]   = ["people_count", "temperature"]
    return JSONResponse(content=resultado, headers=no_store_headers())


@app.get(
    "/v1/readings/stats",
    response_model=EstatisticasOut,
    summary="Estatísticas agregadas das leituras",
    description=(
        "Retorna totais, médias e leituras recentes do banco. Suporta paginação via "
        "parâmetros `page` (≥ 1) e `limit` (1 a 100, padrão 20). Cache curto de 30s."
    ),
    tags=["readings"],
    responses={
        200: {"description": "Estatísticas retornadas"},
        422: {"description": "Parâmetros de paginação inválidos"},
        429: {"description": "Rate limit excedido"},
    },
)
@limiter.limit("60/minute")
def estatisticas(
    request: Request,
    page:  int = Query(1,  ge=1,            description="Página (≥ 1)"),
    limit: int = Query(20, ge=1, le=100,    description="Itens por página (1 a 100)"),
):
    offset = (page - 1) * limit

    with get_db() as conn:
        total    = conn.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
        avg_con  = conn.execute("SELECT AVG(consumption) FROM readings").fetchone()[0] or 0
        max_con  = conn.execute("SELECT MAX(consumption) FROM readings").fetchone()[0] or 0
        recentes = conn.execute(
            "SELECT ts, people, temperature, ac, consumption FROM readings "
            "ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()

    baseline = 1600.0
    economia = round((1.0 - avg_con / baseline) * 100.0, 1) if baseline > 0 else 0

    payload = {
        "total_readings":    total,
        "avg_consumption_w": round(avg_con),
        "max_consumption_w": max_con,
        "avg_saved_pct":     max(0, economia),
        "page":              page,
        "limit":             limit,
        "total_pages":       max(1, (total + limit - 1) // limit),
        "recent": [
            {
                "ts":          r["ts"],
                "people":      r["people"],
                "temperature": r["temperature"],
                "ac":          r["ac"],
                "consumption": r["consumption"],
            }
            for r in recentes
        ],
    }
    return JSONResponse(content=payload, headers=short_cache_headers(30))
