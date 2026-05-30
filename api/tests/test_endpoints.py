import os
import sys
import tempfile

# usa banco temporário durante os testes
os.environ["DB_PATH"] = tempfile.mktemp(suffix=".db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_retorna_200_e_status_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["model_trained"] is True
    assert body["training_samples"] > 0


def test_post_readings_retorna_201_em_caso_de_sucesso():
    resp = client.post("/v1/readings", json={
        "peopleCount":  3,
        "temperature":  25.0,
        "lightStatus":  "ON",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["ok"] is True
    assert "anomaly_score" in body


def test_post_readings_retorna_cache_control_no_store():
    resp = client.post("/v1/readings", json={
        "peopleCount":  0,
        "temperature":  22.0,
        "lightStatus":  "OFF",
        "acStatus":     "OFF",
        "consumption":  0,
    })
    assert "no-store" in resp.headers.get("cache-control", "")


def test_get_predictions_funciona_com_parametros_validos():
    resp = client.get("/v1/predictions?people=5&temperature=26.0")
    assert resp.status_code == 200
    body = resp.json()
    assert "predicted_consumption_w" in body
    assert body["model_type"] == "LinearRegression"


def test_get_stats_retorna_paginacao_corretamente():
    resp = client.get("/v1/readings/stats?page=1&limit=10")
    assert resp.status_code == 200
    body = resp.json()
    assert body["page"] == 1
    assert body["limit"] == 10
    assert "total_pages" in body
    assert len(body["recent"]) <= 10


def test_idempotency_key_evita_duplicacao():
    payload = {
        "peopleCount":  2,
        "temperature":  23.5,
        "lightStatus":  "ON",
        "acStatus":     "OFF",
        "consumption":  100,
    }
    headers = {"Idempotency-Key": "teste-idem-12345"}

    r1 = client.post("/v1/readings", json=payload, headers=headers)
    r2 = client.post("/v1/readings", json=payload, headers=headers)

    assert r1.status_code == 201
    assert r2.status_code == 200  # segunda chamada retorna 200, não 201


def test_openapi_schema_acessivel():
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    spec = resp.json()
    assert spec["info"]["title"] == "Smart Building API"
    assert "/v1/readings" in spec["paths"]
    assert "/v1/predictions" in spec["paths"]


def test_swagger_ui_acessivel():
    resp = client.get("/docs")
    assert resp.status_code == 200
