#!/usr/bin/env bash
# Suite de regressao visual (SUC-42), dentro da imagem oficial do Playwright.
#
# Baseline de screenshot depende de sistema operacional, de fonte e do navegador:
# gerada fora de um ambiente fixo, ela nao casa com a de quem a gerou em outro.
# Por isso a suite roda SEMPRE no contêiner, na mesma versao do `@playwright/test`
# do projeto — localmente e no CI, pelo mesmo comando.
#
# Uso:
#   yarn test:visual                 compara com as baselines
#   yarn test:visual:update          regrava as baselines (revise o diff imagem a imagem)
#   yarn test:visual -- <argumentos>  repassa argumentos ao `playwright test`
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "A regressao visual precisa do Docker, instalado e com o daemon ativo." >&2
  exit 1
fi

version="$(node -p "require('@playwright/test/package.json').version")"
image="mcr.microsoft.com/playwright:v${version}-noble"

# `--user`: os resultados gravados no projeto continuam do usuario local, nao de
# root. `HOME` gravavel porque esse usuario nao existe na imagem.
#
# `--tmpfs` em `.next`: o build de producao do contêiner, feito sob outro Node, nao
# pode sobrescrever o `.next` da maquina — quem tem `yarn dev` rodando perderia o
# servidor. O build some junto com o contêiner.
#
# `CI` so passa adiante quando definido, para o contêiner se comportar como o
# ambiente que o chamou (reporter, `forbidOnly`, reuso de servidor).
env_args=(-e HOME=/tmp -e PLAYWRIGHT_VISUAL=1)
if [[ -n "${CI:-}" ]]; then
  env_args+=(-e CI)
fi

exec docker run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" \
  "${env_args[@]}" \
  --tmpfs "/work/.next:rw,exec,uid=$(id -u),gid=$(id -g)" \
  -v "$PWD":/work \
  -w /work \
  "$image" \
  yarn playwright test --project=visual "$@"
