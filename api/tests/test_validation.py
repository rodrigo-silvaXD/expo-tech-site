import os
import sys
import tempfile

os.environ["DB_PATH"] = tempfile.mktemp(suffix=".db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_people_count_negativo_retorna_422():
    resp = client.post("/v1/readings", json={
        "peopleCount":  -1,
        "temperature":  25.0,
        "lightStatus":  "ON",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 422


def test_people_count_acima_do_limite_retorna_422():
    resp = client.post("/v1/readings", json={
        "peopleCount":  99,
        "temperature":  25.0,
        "lightStatus":  "ON",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 422


def test_temperatura_fora_do_range_retorna_422():
    resp = client.post("/v1/readings", json={
        "peopleCount":  3,
        "temperature":  -5.0,
        "lightStatus":  "ON",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 422


def test_light_status_invalido_retorna_422():
    resp = client.post("/v1/readings", json={
        "peopleCount":  3,
        "temperature":  25.0,
        "lightStatus":  "BROKEN",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 422


def test_predictions_sem_query_param_retorna_422():
    resp = client.get("/v1/predictions")
    assert resp.status_code == 422


def test_stats_page_invalida_retorna_422():
    resp = client.get("/v1/readings/stats?page=0&limit=10")
    assert resp.status_code == 422


def test_stats_limit_acima_do_maximo_retorna_422():
    resp = client.get("/v1/readings/stats?page=1&limit=999")
    assert resp.status_code == 422
