# Smart Building — Sistema de Automação Inteligente

Projeto desenvolvido para a **Expo Tech 2026 — UniFECAF**, curso de Engenharia de Computação.

Simula um sistema de automação predial com sensores PIR e DHT11, controle inteligente
de iluminação e ar-condicionado, módulo de predição de consumo energético via Machine
Learning e visualização 3D interativa do ambiente.

---

## Demonstração

🔗 **Site:** https://smartbuilding-frontend.onrender.com
🔗 **API:** https://smartbuilding-api.onrender.com
🔗 **Swagger UI:** https://smartbuilding-api.onrender.com/docs
🔗 **OpenAPI YAML:** [`api/openapi.yaml`](api/openapi.yaml)

> O backend roda no plano gratuito do Render e pode demorar ~30 segundos para
> responder na primeira requisição (cold start).

---

## Funcionalidades

- Cena 3D interativa com Three.js (câmera orbitável, personagens animados, AC e iluminação reativos)
- Simulação de sensores PIR (presença) e DHT11 (temperatura) com física térmica
- Automação inteligente baseada em regras: luz e AC controlados pela ocupação e temperatura
- Tópicos MQTT simulados em tempo real
- **Módulo de IA:** regressão linear (scikit-learn) para predição de consumo e detecção de anomalias
- **Backend REST versionado:** FastAPI com OpenAPI, rate limiting e padrão de erro RFC 7807
- Banco SQLite para histórico de leituras
- Dashboard com gráficos em tempo real, log de decisões e análise de economia de energia
- 4 cenários pré-configurados + demonstração automática de 78 segundos

---

## Endpoints da API

Base URL: `https://smartbuilding-api.onrender.com`

| Método | Rota                       | Descrição                                        | Rate limit |
|--------|----------------------------|--------------------------------------------------|------------|
| GET    | `/health`                  | Status do serviço e do modelo de ML              | —          |
| POST   | `/v1/readings`             | Armazena leitura dos sensores (retorna 201)      | 120/min    |
| GET    | `/v1/readings/stats`       | Estatísticas agregadas com paginação             | 60/min     |
| GET    | `/v1/predictions`          | Predição de consumo via regressão linear         | 300/min    |
| GET    | `/docs`                    | Swagger UI interativa                            | —          |
| GET    | `/openapi.json`            | Contrato OpenAPI em JSON                         | —          |

Detalhes completos: ver [`api/openapi.yaml`](api/openapi.yaml) e
[`docs/API_GOVERNANCE.md`](docs/API_GOVERNANCE.md).

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Render)                  │
│  React 18 + Vite + Three.js + Recharts              │
│  Dashboard com card de IA, gráficos em tempo real,  │
│  cena 3D interativa e simulação de sensores.        │
└───────────────────────────┬─────────────────────────┘
                            │ HTTP REST /v1/*
┌───────────────────────────▼─────────────────────────┐
│                   BACKEND (Render)                   │
│  FastAPI + uvicorn                                   │
│  ├── /v1/readings      (POST, 201, idempotente)     │
│  ├── /v1/predictions   (GET, com validação)         │
│  ├── /v1/readings/stats (GET, paginado, cache 30s)  │
│  └── /health           (GET)                         │
│                                                      │
│  • SQLite (histórico de leituras)                    │
│  • scikit-learn LinearRegression                     │
│  • slowapi (rate limiting por IP)                    │
│  • RFC 7807 (padrão de erro)                         │
└─────────────────────────────────────────────────────┘
```

---

## Tecnologias

**Frontend:** React 18, Vite 5, Three.js, React Three Fiber, Recharts

**Backend:** Python 3.11, FastAPI 0.111, uvicorn, scikit-learn 1.4, NumPy, slowapi, SQLite

**Qualidade:** pytest, httpx, GitHub Actions, Spectral (lint OpenAPI)

---

## Rodar localmente

### Frontend
```bash
npm install
npm run dev
# http://localhost:3000
```

### Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/docs
```

### Conectar frontend ao backend local

Crie um arquivo `.env` na raiz:
```
VITE_API_URL=http://localhost:8000
```

### Rodar os testes
```bash
cd api
pip install -r requirements-dev.txt
pytest -v
```

---

## Deploy no Render

### Backend (Web Service)
- Root Directory: `api`
- Runtime: Python 3
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars:
  - `DB_PATH=/opt/render/project/src/smartbuilding.db`
  - `ALLOWED_ORIGINS=https://smartbuilding-frontend.onrender.com`

### Frontend (Static Site)
- Build: `npm install && npm run build`
- Publish: `dist`
- Env var: `VITE_API_URL=https://smartbuilding-api.onrender.com`

---

## Estrutura do Repositório

```
expo-tech-site/
├── .github/workflows/ci.yml       # CI: testes + lint OpenAPI
├── api/
│   ├── main.py                    # FastAPI app
│   ├── schemas.py                 # Modelos Pydantic
│   ├── errors.py                  # Handlers RFC 7807
│   ├── ratelimit.py               # Configuração slowapi
│   ├── tests/                     # Testes pytest
│   ├── scripts/export_openapi.py  # Gera openapi.yaml
│   ├── openapi.yaml               # Contrato OpenAPI (gerado)
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── render.yaml
├── docs/
│   └── API_GOVERNANCE.md          # Padrões, justificativas, SLO, depreciação
├── src/
│   ├── hooks/useSmartBuilding.js
│   ├── components/                # Scene3D, Dashboard (com AIPanel)
│   └── styles/
├── README.md
└── ...
```

---

## Requisitos do Projeto Integrador (Expo Tech 2026)

### Smart Building (engenharias)
| Requisito | Implementação |
|---|---|
| Módulo de IA | Regressão linear (scikit-learn) — predição + anomalias |
| Dashboard de monitoramento | React com 6 cards e gráficos em tempo real |
| Backend estruturado | FastAPI versionado (/v1) com OpenAPI |
| Integração IoT / Simulação | Sensores PIR e DHT11 simulados, tópicos MQTT |

### ECO-API
| Critério | Implementação |
|---|---|
| Arquitetura & Protocolos | Versionamento /v1, status codes corretos, RFC 7807 |
| DX & Documentação | OpenAPI exportado, Swagger UI, descrições e exemplos |
| Segurança | Rate limiting, validação Pydantic, CORS restrito, Cache-Control |
| Performance & Resiliência | Paginação, cache, idempotency-key, rate limit |
| Governança | CI/CD GitHub Actions, plano de depreciação, SLO definido |
| Repositório | Código, testes pytest, README e contrato OpenAPI |

Detalhes e justificativas: [`docs/API_GOVERNANCE.md`](docs/API_GOVERNANCE.md).

---

## Licença

Projeto acadêmico — UniFECAF 2026.
