const fs = require("fs");
const path = require("path");

const { COLOR } = require("./colors");
const { shellQuote } = require("./shell");

function getShellIntegrationScript() {
  return `# env-cli shell integration
env-cli() {
  local __env_cli_apply_file
  __env_cli_apply_file="$(mktemp)"
  ENV_CLI_APPLY_FILE="$__env_cli_apply_file" command "\${ENV_CLI_BIN:-env-cli}" "$@"
  local __env_cli_status=$?
  if [ -s "$__env_cli_apply_file" ]; then
    . "$__env_cli_apply_file"
  fi
  rm -f "$__env_cli_apply_file"
  return $__env_cli_status
}

envset() {
  local __env_cli_output
  __env_cli_output="$(command "\${ENV_CLI_BIN:-env-cli}" select "$@")" || return $?
  eval "$__env_cli_output"
}
`;
}

function getShellRcPath() {
  const shell = process.env.SHELL || "";
  const home = process.env.HOME || process.cwd();

  if (shell.endsWith("zsh")) return path.join(home, ".zshrc");
  return path.join(home, ".bashrc");
}

function getUserBinDir() {
  return path.join(process.env.HOME || process.cwd(), ".local", "bin");
}

function setupShellIntegration(cliEntryPath) {
  const binDir = getUserBinDir();
  const binPath = path.join(binDir, "env-cli");
  const rcPath = getShellRcPath();
  const integration = getShellIntegrationScript();
  const rcBlock = `
# >>> ENV_CLI setup >>>
export PATH="$HOME/.local/bin:$PATH"
export ENV_CLI_BIN="$HOME/.local/bin/env-cli"
${integration.trimEnd()}
# <<< ENV_CLI setup <<<
`;

  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(binPath, `#!/usr/bin/env sh
exec node ${shellQuote(cliEntryPath)} "$@"
`, { mode: 0o755 });

  const currentRc = fs.existsSync(rcPath) ? fs.readFileSync(rcPath, "utf8") : "";
  const nextRc = upsertEnvCliBlock(currentRc, rcBlock);
  fs.writeFileSync(rcPath, nextRc, "utf8");

  console.log(`${COLOR.green}ENV_CLI 자동 설정 완료.${COLOR.reset}`);
  console.log(`${COLOR.white}실행 파일${COLOR.reset} : ${COLOR.gray}${binPath}${COLOR.reset}`);
  console.log(`${COLOR.white}셸 설정${COLOR.reset} : ${COLOR.gray}${rcPath}${COLOR.reset}`);
  console.log(`${COLOR.yellow}새 터미널을 열면 eval 없이 env-cli 명령을 바로 사용할 수 있습니다.${COLOR.reset}`);
  console.log(`${COLOR.gray}현재 터미널에서 바로 쓰려면 source ${rcPath} 가 필요합니다.${COLOR.reset}`);
}

function upsertEnvCliBlock(content, block) {
  const start = "# >>> ENV_CLI setup >>>";
  const end = "# <<< ENV_CLI setup <<<";
  const pattern = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`);

  if (content.includes(start) && content.includes(end)) {
    return content.replace(pattern, `\n${block.trimEnd()}\n`);
  }

  return `${content.replace(/\s*$/, "")}\n${block}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  getShellIntegrationScript,
  setupShellIntegration,
};
