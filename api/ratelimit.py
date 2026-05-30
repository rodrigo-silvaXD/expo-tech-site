from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


# limita por IP de origem — protege a API de uso abusivo
limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    # resposta padronizada RFC 7807 com header Retry-After
    response = JSONResponse(
        status_code=429,
        content={
            "type":     "https://github.com/rodrigo-silvaXD/expo-tech-site/blob/main/docs/API_GOVERNANCE.md#rate-limit",
            "title":    "Too Many Requests",
            "status":   429,
            "detail":   f"Limite excedido: {exc.detail}. Tente novamente em alguns segundos.",
            "instance": str(request.url.path),
        },
        media_type="application/problem+json",
    )
    response.headers["Retry-After"] = "60"
    return response
