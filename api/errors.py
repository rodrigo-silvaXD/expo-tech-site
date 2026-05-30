from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# implementa o padrão RFC 7807 (Problem Details for HTTP APIs)
# https://datatracker.ietf.org/doc/html/rfc7807


PROBLEM_BASE_URI = "https://github.com/rodrigo-silvaXD/expo-tech-site/blob/main/docs/API_GOVERNANCE.md#errors"


def problem_response(
    status_code: int,
    title:       str,
    detail:      str,
    instance:    str,
    extra:       dict | None = None,
) -> JSONResponse:
    body = {
        "type":     f"{PROBLEM_BASE_URI}#{title.lower().replace(' ', '-')}",
        "title":    title,
        "status":   status_code,
        "detail":   detail,
        "instance": instance,
    }
    if extra:
        body.update(extra)
    return JSONResponse(
        status_code=status_code,
        content=body,
        media_type="application/problem+json",
    )


def register_error_handlers(app: FastAPI):

    @app.exception_handler(RequestValidationError)
    def validation_handler(request: Request, exc: RequestValidationError):
        return problem_response(
            status_code=422,
            title="Validation Error",
            detail="Um ou mais campos da requisição são inválidos.",
            instance=str(request.url.path),
            extra={"errors": exc.errors()},
        )

    @app.exception_handler(HTTPException)
    def http_handler(request: Request, exc: HTTPException):
        return problem_response(
            status_code=exc.status_code,
            title=exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            detail=str(exc.detail),
            instance=str(request.url.path),
        )

    @app.exception_handler(Exception)
    def generic_handler(request: Request, exc: Exception):
        return problem_response(
            status_code=500,
            title="Internal Server Error",
            detail="Erro interno inesperado. A equipe foi notificada via logs.",
            instance=str(request.url.path),
        )
