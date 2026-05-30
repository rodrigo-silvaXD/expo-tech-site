# Governança da API — Smart Building

Documento de referência para padrões, decisões de arquitetura e justificativas técnicas.

---

## 1. Decisões de Design

### 1.1 Versionamento por URL (/v1/)

Optamos por versionamento via prefixo de URL (`/v1/readings`, `/v1/predictions`) ao invés
de header customizado ou media type. Razões:

- **Visibilidade:** a versão fica explícita na URL, facilitando debugging em logs e
  ferramentas como Postman/curl.
- **Cache:** caches HTTP intermediários (ex: Cloudflare) tratam URLs diferentes como
  recursos distintos automaticamente.
- **Simplicidade para o consumidor:** o frontend só precisa configurar a base URL,
  sem manipular headers de versão.

O endpoint `/health` não é versionado por ser um padrão de infraestrutura
(monitoramento e healthchecks de load balancers).

### 1.2 Escolha entre POST e PUT

A única operação de escrita da API é `POST /v1/readings`. Foi escolhido POST porque:

- Cada leitura é um evento imutável (snapshot do estado dos sensores em um instante).
- Leituras não são substituídas nem atualizadas — apenas inseridas em série temporal.
- O recurso não tem identificador conhecido pelo cliente antes da criação (o ID é
  gerado pelo servidor via AUTOINCREMENT).

Por isso PUT (que exige idempotência e identificador do recurso) e PATCH (atualização
parcial) não se aplicam ao modelo de dados deste projeto.

### 1.3 Idempotência em POST

POST normalmente não é idempotente, mas implementamos suporte opcional ao header
`Idempotency-Key`. Quando presente, o servidor verifica se já existe uma leitura com
aquela chave e retorna o resultado anterior (status 200) ao invés de duplicar (status 201).

Isso protege contra:
- Retries automáticos do cliente em caso de falha de rede
- Duplo clique acidental

---

## 2. Padrão de Erros — RFC 7807

Todas as respostas de erro seguem o formato Problem Details (`application/problem+json`):

```json
{
  "type":     "https://.../docs/API_GOVERNANCE.md#errors",
  "title":    "Validation Error",
  "status":   422,
  "detail":   "Um ou mais campos da requisição são inválidos.",
  "instance": "/v1/readings",
  "errors":   [...]
}
```

### Códigos de status usados

| Código | Quando ocorre |
|--------|---------------|
| 200    | Sucesso em GET ou em POST idempotente repetido |
| 201    | Sucesso em POST que criou um recurso novo |
| 422    | Erro de validação no body ou query params |
| 429    | Rate limit excedido — header `Retry-After` indica espera |
| 500    | Erro interno inesperado |

---

## 3. Rate Limiting

Implementado via `slowapi` (FastAPI). Limites por IP de origem:

| Endpoint                | Limite           |
|-------------------------|------------------|
| POST /v1/readings       | 120 req/min      |
| GET  /v1/predictions    | 300 req/min      |
| GET  /v1/readings/stats | 60 req/min       |
| GET  /health            | sem limite       |

Quando excedido, retorna `429 Too Many Requests` com header `Retry-After: 60`.

Estes limites foram dimensionados para a operação normal do frontend (envio de leitura
a cada 6 segundos = 10 req/min por usuário). Os limites suportam até ~12 usuários
simultâneos sem throttling.

---

## 4. Cache HTTP

| Endpoint                | Cache-Control                              |
|-------------------------|--------------------------------------------|
| POST /v1/readings       | `no-store, no-cache, must-revalidate`      |
| GET  /v1/predictions    | `no-store` (predição muda com o modelo)    |
| GET  /v1/readings/stats | `public, max-age=30` (dados agregados)     |
| GET  /health            | sem header de cache                        |

A escolha de `no-store` para predictions evita que respostas antigas sejam reaproveitadas
após o modelo ser retreinado (a cada 30 leituras).

---

## 5. Itens do Guia ECO-API — Aplicabilidade

### 5.1 Autenticação (JWT / OAuth2) — NÃO APLICÁVEL

**Justificativa técnica:**

A API serve dados de simulação de um ambiente predial fictício para fins acadêmicos
e demonstração na Expo Tech 2026. Características relevantes:

- **Não há dados pessoais (PII)**. Os dados armazenados são leituras numéricas de
  sensores simulados (temperatura, contagem, estado de equipamentos).
- **Não há conceito de usuário**. A API não tem login, perfil, sessão ou propriedade
  de recursos por pessoa.
- **Não há recursos protegidos**. Todas as informações expostas são intencionalmente
  públicas para que avaliadores e visitantes da Expo Tech consigam interagir.

Implementar autenticação sem dados a proteger acrescentaria complexidade operacional
(gestão de tokens, refresh, store de credenciais) sem benefício de segurança.

### 5.2 BOLA / BOPLA — NÃO APLICÁVEL

**Justificativa técnica:**

BOLA (Broken Object Level Authorization) e BOPLA (Broken Object Property Level
Authorization) são vulnerabilidades em APIs com recursos pertencentes a usuários
específicos. Como descrito em 5.1, não há contexto multi-usuário neste projeto.
Todos os recursos são globais.

### 5.3 API Gateway / BFF — NÃO APLICÁVEL NA PRODUÇÃO ATUAL

**Justificativa técnica:**

O sistema roda como serviço único no Render free tier. Um API Gateway introduziria
custo e latência adicionais sem benefício no escopo atual (1 consumidor, 4 endpoints,
sem necessidade de roteamento ou agregação).

**Caso o projeto evolua**, um gateway entraria para:
- Centralizar autenticação quando houver múltiplas APIs
- Aplicar rate limiting de forma uniforme entre serviços
- Roteamento por versão ou tenant

Hoje, rate limiting está aplicado diretamente na aplicação via `slowapi`.

### 5.4 Consumer-Driven Contracts (Pact) — NÃO APLICÁVEL NO ESCOPO ATUAL

**Justificativa técnica:**

Pact resolve o problema de desacoplamento entre múltiplos consumidores e a API.
Hoje há apenas um consumidor (o próprio frontend do projeto), desenvolvido pela
mesma equipe e deployado a partir do mesmo repositório. O contrato é validado
pelos testes automatizados de endpoint no CI.

**Quando faria sentido adotar Pact:**
- Múltiplos times consumindo a API independentemente
- Deploy desacoplado entre frontend e backend
- Necessidade de can-i-deploy no pipeline

---

## 6. Plano de Depreciação

Quando um endpoint precisar ser removido:

1. **Anúncio (90 dias antes):** adicionar header `Sunset` nas respostas:
   ```
   Sunset: Wed, 30 Aug 2026 00:00:00 GMT
   Deprecation: true
   Link: <https://.../docs/API_GOVERNANCE.md#deprecations>; rel="deprecation"
   ```

2. **Monitoramento:** acompanhar via logs o volume de chamadas ao endpoint depreciado.

3. **Comunicação:** atualizar README, CHANGELOG e abrir issue marcada como `deprecation`
   no GitHub.

4. **Remoção:** após a data de Sunset e quando o volume de chamadas estiver em zero,
   remover o endpoint na próxima versão major.

---

## 7. SLO (Service Level Objectives)

Metas de qualidade de serviço propostas:

| Métrica                            | Meta              |
|------------------------------------|-------------------|
| Disponibilidade mensal             | ≥ 99% (ajustado pela limitação do free tier do Render — cold start) |
| Latência p95 (predictions)         | < 500 ms          |
| Latência p95 (readings POST)       | < 800 ms          |
| Taxa de erro 5xx                   | < 1% das requests |

Estes SLOs são adequados ao plano gratuito do Render. Em produção real, com plano
pago e múltiplas instâncias, os números seriam ajustados para disponibilidade
≥ 99.9% e latência p95 < 200 ms.

---

## 8. Observabilidade

### Logs
- O FastAPI/uvicorn registra requests no stdout (acessível via dashboard do Render).
- Erros 5xx incluem stack trace completo nos logs do Render.

### Métricas (proposta de evolução)
Em produção, expor métricas Prometheus em `/metrics` com:
- Contagem de requests por endpoint e status code
- Histograma de latência por endpoint
- Cache hit/miss ratio
- Contagem de 429 (rate limit)

Hoje não implementado por simplicidade do escopo acadêmico.
