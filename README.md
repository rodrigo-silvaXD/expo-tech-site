# Smart Building — Sistema de Automação Inteligente

Projeto desenvolvido para a **Expo Tech 2026 — UniFECAF**, curso de Engenharia de Computação.

Simula um sistema de automação predial com sensores PIR e DHT11, controle inteligente de
iluminação e ar-condicionado, módulo de predição de consumo energético via Machine Learning
e visualização 3D interativa do ambiente.

---

## Demonstração

🔗 **Site:** https://expo-tech-site.onrender.com  
🔗 **API:** https://smartbuilding-api.onrender.com/docs

> O backend roda no plano gratuito do Render e pode demorar ~30 segundos para responder
> na primeira requisição (cold start). O frontend funciona normalmente enquanto isso.

---

## Funcionalidades

- Cena 3D interativa com Three.js (câmera orbitável, personagens animados, AC e iluminação reativos)
- Simulação de sensores PIR (presença) e DHT11 (temperatura) com física térmica
- Automação inteligente baseada em regras: luz e AC controlados pela ocupação e temperatura
- Tópicos MQTT simulados em tempo real
- **Módulo de IA:** regressão linear (scikit-learn) para predição de consumo energético e detecção de anomalias
- Backend REST (FastAPI) com banco de dados SQLite para armazenamento histórico de leituras
- Dashboard com gráficos em tempo real, log de decisões e análise de economia de energia
- 4 cenários pré-configurados + demonstração automática de 78 segundos

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Render)                  │
│                                                      │
│  React 18 + Vite                                     │
│  ├── Scene3D (Three.js / R3F)                        │
│  │     └── Room, People, ACUnit, CeilingLight        │
│  ├── Dashboard                                       │
│  │     ├── StatusCard, SensorData, DecisionLog       │
│  │     ├── EconomyPanel, Charts (Recharts)           │
│  │     └── AIPanel ←─────────────────────────┐       │
│  └── useSmartBuilding (hook central)         │       │
│        └── fetch a cada 6s ──────────────────┘       │
└───────────────────────────┬─────────────────────────┘
                            │ HTTP REST
┌───────────────────────────▼─────────────────────────┐
│                   BACKEND (Render)                   │
│                                                      │
│  FastAPI + uvicorn                                   │
│  ├── POST /api/readings  → salva leitura no banco    │
│  ├── GET  /api/predict   → predição via sklearn      │
│  ├── GET  /api/stats     → histórico agregado        │
│  └── GET  /health        → status do serviço         │
│                                                      │
│  SQLite (armazenamento de leituras)                  │
│  scikit-learn LinearRegression                       │
│    features: [people_count, temperature]             │
│    target:   consumption (watts)                     │
└─────────────────────────────────────────────────────┘
```

---

## Módulo de IA

O módulo de predição usa regressão linear treinada com dados que replicam a física do
sistema. As features de entrada são número de pessoas na sala e temperatura ambiente. O
target é o consumo energético em watts.

O modelo é inicializado com 600 amostras sintéticas e retreinado automaticamente a cada
30 novas leituras reais armazenadas no banco.

Além da predição, o sistema calcula um **score de anomalia** — desvio percentual entre
o consumo real e o previsto. Desvios acima de 40% ativam um alerta de comportamento anômalo.

**Endpoints:**
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/readings` | Armazena leitura dos sensores |
| GET | `/api/predict?people=N&temperature=T` | Predição de consumo |
| GET | `/api/stats` | Histórico e médias |
| GET | `/health` | Status da API |

---

## Tecnologias

**Frontend**
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.2 | Interface e gerenciamento de estado |
| Vite | 5.0 | Build e dev server |
| Three.js | 0.158 | Engine 3D WebGL |
| @react-three/fiber | 8.15 | Renderer React para Three.js |
| @react-three/drei | 9.92 | Helpers (OrbitControls) |
| Recharts | 2.10 | Gráficos de área em tempo real |

**Backend**
| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.11 | Linguagem do backend |
| FastAPI | 0.111 | Framework REST |
| uvicorn | 0.29 | Servidor ASGI |
| scikit-learn | 1.4 | Modelo de regressão linear |
| NumPy | 1.26 | Processamento numérico |
| SQLite | — | Banco de dados local |

---

## Rodar localmente

**Frontend**
```bash
npm install
npm run dev
# acessa em http://localhost:3000
```

**Backend**
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# documentação em http://localhost:8000/docs
```

**Conectar frontend ao backend local**

Crie um arquivo `.env` na raiz do projeto:
```
VITE_API_URL=http://localhost:8000
```

---

## Deploy no Render

### Backend (Web Service)
1. Novo serviço → Web Service → conectar repositório
2. Root Directory: `api`
3. Runtime: Python
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Variável de ambiente: `DB_PATH` = `/opt/render/project/src/smartbuilding.db`

### Frontend (Static Site)
1. Novo serviço → Static Site → mesmo repositório
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Variável de ambiente: `VITE_API_URL` = URL do backend acima

---

## Estrutura do Repositório

```
expo-tech-site/
├── api/                        # backend Python
│   ├── main.py                 # FastAPI + ML + SQLite
│   ├── requirements.txt
│   └── render.yaml
├── src/
│   ├── hooks/
│   │   └── useSmartBuilding.js # lógica central + integração API
│   ├── components/
│   │   ├── Scene3D/            # cena 3D (Room, People, ACUnit, CeilingLight)
│   │   ├── Dashboard/          # painel lateral (6 cards)
│   │   │   └── AIPanel.jsx     # card do módulo de IA
│   │   ├── Controls.jsx        # botões de cenário
│   │   └── ExplanationBubble.jsx
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## Requisitos do Projeto Integrador (Expo Tech 2026)

| Requisito | Status | Implementação |
|---|---|---|
| Módulo de IA | ✅ | Regressão linear (scikit-learn) — predição de consumo + detecção de anomalias |
| Dashboard de monitoramento | ✅ | React com 6 cards, gráficos em tempo real |
| Backend estruturado | ✅ | FastAPI com endpoints REST e banco SQLite |
| Integração IoT / Simulação | ✅ | Sensores PIR e DHT11 simulados, tópicos MQTT em tempo real |

---

## Licença

Projeto acadêmico — UniFECAF 2026.
