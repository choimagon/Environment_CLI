# env-cli-switcher

ENV_CLI 스타일의 터미널 CLI입니다. `/conda`, `/cuda` 같은 명령어로 conda env와 CUDA 버전을 화살표 메뉴에서 선택할 수 있습니다.

## 요구사항

- Linux
- Node.js
- npm
- conda 또는 mamba 기반 Python 환경
- CUDA가 `/usr/local/cuda*` 형태로 설치된 환경

Node.js/npm이 없는 Ubuntu/Debian 환경에서는 먼저 설치합니다.

```bash
sudo apt update
sudo apt install -y nodejs npm git
```

apt의 Node.js 버전이 너무 오래된 경우 NodeSource를 사용할 수 있습니다.

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs git
```

## 다른 컴퓨터에서 설치

GitHub에서 받아서 설치합니다.

```bash
git clone https://github.com/choimagon/Environment_CLI.git
cd Environment_CLI
node bin/env-cli.js setup
```

현재 터미널에서 바로 쓰려면 shell 설정을 다시 불러옵니다.

```bash
source ~/.bashrc
```

zsh를 쓰는 경우:

```bash
source ~/.zshrc
```

새 터미널을 열면 `source` 없이 바로 사용할 수 있습니다.

## 실행

CLI를 시작합니다.

```bash
env-cli
```

CLI 안에서 사용할 수 있는 명령:

```text
/help
/conda
/cuda
/desc
/exit
```

`/desc`를 실행하면 conda/CUDA 항목을 화살표로 이동하면서 설명을 입력할 수 있습니다. `/conda`, `/cuda` 선택 메뉴에서는 `e`를 눌러 현재 항목 설명을 바로 수정할 수도 있습니다. 설명은 `~/.config/env-cli/descriptions.json`에 저장됩니다.
메인 프롬프트에서는 Tab으로 명령어를 자동완성할 수 있습니다.

## 개발 중 로컬 실행

이 repo 안에서 바로 실행할 수도 있습니다.

```bash
node bin/env-cli.js
```

setup을 다시 적용하려면:

```bash
node bin/env-cli.js setup
source ~/.bashrc
```

## conda/CUDA 전환

`setup`을 실행한 뒤에는 `env-cli` 안에서 `/conda`, `/cuda`를 선택하고 CLI를 종료하면 현재 터미널에 적용됩니다.

conda 또는 CUDA 중 먼저 선택합니다.

```bash
envset
```

conda 환경만 바로 고릅니다.

```bash
envset conda
```

CUDA 버전만 바로 고릅니다.

```bash
envset cuda
```

감지된 항목을 확인합니다.

```bash
env-cli doctor
```

## 동작 방식

- conda는 `conda env list --json` 결과를 읽고, 선택한 env 경로로 `conda activate <path>`를 실행합니다.
- CUDA는 `/usr/local/cuda*` 폴더를 찾고, 선택한 경로를 `CUDA_HOME`, `CUDA_PATH`, `PATH`, `LD_LIBRARY_PATH`에 반영합니다.
- `env-cli init`은 `env-cli` wrapper를 만들고, 선택된 셸 코드를 임시 파일로 받아 현재 터미널에 적용합니다.
- `envset conda`, `envset cuda`는 선택 즉시 현재 터미널에 적용하는 짧은 명령입니다.
