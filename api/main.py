from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
import os

app = FastAPI(title="Smart Building API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "smartbuilding.db")


# inicializa o banco na primeira execução
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                ts          TEXT    NOT NULL,
                people      INTEGER NOT NULL,
                temperature REAL    NOT NULL,
                light       TEXT    NOT NULL,
                ac          TEXT    NOT NULL,
                consumption INTEGER NOT NULL
            )
        """)
        conn.commit()


init_db()


# modelo de regressão linear para predição de consumo energético
class EnergyModel:

    def __init__(self):
        self.reg = LinearRegression()
        self.trained = False
        self.training_samples = 0
        self._treinar_sintetico()

    def _treinar_sintetico(self):
        # gera dados sintéticos que replicam a física da simulação
        # usado antes de ter leituras reais suficientes
        rng = np.random.default_rng(42)
        n = 600

        pessoas = rng.integers(0, 11, n).astype(float)
        temps   = 22.0 + pessoas * 0.5 + rng.normal(0, 1.5, n)
        temps   = np.clip(temps, 16.0, 40.0)

        # replica as regras de automação do sistema
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

        baseline   = 1600.0
        economia   = round((1.0 - pred / baseline) * 100.0, 1)

        return {
            "predicted_consumption_w": round(pred),
            "baseline_w":              int(baseline),
            "predicted_saving_pct":    max(0.0, economia),
            "coef_people":             round(float(self.reg.coef_[0]), 2),
            "coef_temp":               round(float(self.reg.coef_[1]), 2),
            "training_samples":        self.training_samples,
        }

    def anomalia(self, real: int, pessoas: int, temperatura: float) -> float:
        # desvio percentual entre consumo real e o previsto pelo modelo
        pred = self.prever(pessoas, temperatura)["predicted_consumption_w"]
        if pred == 0 and real == 0:
            return 0.0
        denominador = max(pred, real, 1)
        return round(abs(real - pred) / denominador * 100.0, 1)


model = EnergyModel()


class LeituraIn(BaseModel):
    peopleCount:  int
    temperature:  float
    lightStatus:  str
    acStatus:     str
    consumption:  int


@app.get("/health")
def health():
    return {
        "status":           "ok",
        "model_trained":    model.trained,
        "training_samples": model.training_samples,
    }


@app.post("/api/readings")
def salvar_leitura(r: LeituraIn):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO readings (ts, people, temperature, light, ac, consumption) "
            "VALUES (?,?,?,?,?,?)",
            (datetime.utcnow().isoformat(),
             r.peopleCount, r.temperature,
             r.lightStatus, r.acStatus, r.consumption),
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

    return {
        "ok":             True,
        "total_readings": total,
        "anomaly_score":  score,
        "anomaly_flag":   score > 40.0,
    }


@app.get("/api/predict")
def prever(people: int, temperature: float):
    resultado = model.prever(people, temperature)
    resultado["model_type"] = "LinearRegression"
    resultado["features"]   = ["people_count", "temperature"]
    return resultado


@app.get("/api/stats")
def estatisticas():
    with get_db() as conn:
        total   = conn.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
        avg_con = conn.execute("SELECT AVG(consumption) FROM readings").fetchone()[0] or 0
        max_con = conn.execute("SELECT MAX(consumption) FROM readings").fetchone()[0] or 0
        recentes = conn.execute(
            "SELECT ts, people, temperature, ac, consumption FROM readings "
            "ORDER BY id DESC LIMIT 30"
        ).fetchall()

    baseline  = 1600.0
    economia  = round((1.0 - avg_con / baseline) * 100.0, 1) if baseline > 0 else 0

    return {
        "total_readings":    total,
        "avg_consumption_w": round(avg_con),
        "max_consumption_w": max_con,
        "avg_saved_pct":     max(0, economia),
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
