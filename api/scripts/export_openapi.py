# script que exporta o contrato OpenAPI da aplicação para arquivo yaml
# rodar: python scripts/export_openapi.py

import sys
import os
import yaml

# adiciona o diretório pai ao path para importar main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


def _float_representer(dumper, data):
    # garante serialização consistente de floats entre versões de Python/PyYAML:
    # valores inteiros como 16.0 e 40.0 saem como "16.0" (não "16")
    if data == int(data):
        return dumper.represent_scalar("tag:yaml.org,2002:float", f"{data:.1f}")
    return dumper.represent_float(data)


yaml.add_representer(float, _float_representer)


def main():
    spec   = app.openapi()
    output = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "openapi.yaml")
    with open(output, "w", encoding="utf-8") as f:
        yaml.dump(spec, f, sort_keys=False, allow_unicode=True)
    print(f"OpenAPI exportado para {output}")


if __name__ == "__main__":
    main()
