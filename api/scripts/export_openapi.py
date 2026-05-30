# script que exporta o contrato OpenAPI da aplicação para arquivo yaml
# rodar: python scripts/export_openapi.py

import sys
import os
import yaml

# adiciona o diretório pai ao path para importar main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


def main():
    spec   = app.openapi()
    output = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "openapi.yaml")
    with open(output, "w", encoding="utf-8") as f:
        yaml.dump(spec, f, sort_keys=False, allow_unicode=True)
    print(f"OpenAPI exportado para {output}")


if __name__ == "__main__":
    main()
