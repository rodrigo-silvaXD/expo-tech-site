import os
import sys
import tempfile

os.environ["DB_PATH"] = tempfile.mktemp(suffix=".db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_erro_de_validacao_segue_rfc_7807():
    resp = client.post("/v1/readings", json={
        "peopleCount":  -10,
        "temperature":  25.0,
        "lightStatus":  "ON",
        "acStatus":     "LOW",
        "consumption":  900,
    })
    assert resp.status_code == 422
    assert resp.headers.get("content-type", "").startswith("application/problem+json")

    body = resp.json()
    assert "type"     in body
    assert "title"    in body
    assert "status"   in body
    assert "detail"   in body
    assert "instance" in body
    assert body["status"] == 422
    assert body["type"].startswith("https://")
