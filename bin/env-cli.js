#!/usr/bin/env node

const fs = require("fs");

const { COLOR } = require("../lib/colors");
const { getItemDescription, setItemDescription } = require("../lib/config");
const { getCondaEnvs, getCudaVersions } = require("../lib/detect");
const { askPlain, editDescriptionMenu, selectFromList } = require("../lib/prompt");
const { getCondaShell, getCudaShell } = require("../lib/shell");
const { getShellIntegrationScript, setupShellIntegration } = require("../lib/setup");
const {
  printDoctor,
  showBanner,
  showCurrentEnvStatus,
  showCurrentPath,
  showHelp,
  showSelectedEnvStatus,
} = require("../lib/ui");

const cliEntryPath = fs.realpathSync(__filename);
const CLI_COMMANDS = ["/conda", "/cuda", "/desc", "/help", "/exit"];

function completeCommand(line) {
  const hits = CLI_COMMANDS.filter((command) => command.startsWith(line));
  return [hits.length ? hits : CLI_COMMANDS, line];
}

function ask(message) {
  return askPlain(message, { completer: completeCommand });
}

function showInit() {
  process.stdout.write(getShellIntegrationScript());
}

function printApplyGuide(shellCode) {
  if (process.env.ENV_CLI_APPLY_FILE) {
    fs.writeFileSync(process.env.ENV_CLI_APPLY_FILE, `${shellCode}\n`, "utf8");
    console.log(`${COLOR.green}선택 완료.${COLOR.reset}`);
    console.log(`${COLOR.yellow}현재 CLI를 종료하면, 이 CLI를 실행한 바로 그 터미널에 적용됩니다.${COLOR.reset}`);
    return;
  }

  console.log(`${COLOR.green}선택 완료.${COLOR.reset}`);
  console.log(`${COLOR.red}아직 ENV_CLI shell wrapper가 설정되지 않았습니다.${COLOR.reset}`);
  console.log(`${COLOR.yellow}내가 실행한 바로 그 터미널에 적용하려면 아래 명령을 한 번만 실행해야 합니다.${COLOR.reset}\n`);
  console.log(`${COLOR.green}node ${cliEntryPath} setup${COLOR.reset}\n`);
  console.log(`${COLOR.gray}그 다음 새 터미널에서 env-cli를 실행하면 /conda, /cuda 선택 후 /exit 시 현재 터미널에 적용됩니다.${COLOR.reset}`);
}

async function runCondaSetup({ shellOnly = false } = {}) {
  const env = await selectFromList("Select conda environment", getCondaEnvs(), {
    getDescription: getItemDescription,
    setDescription: setItemDescription,
  });
  if (!env) throw new Error("No conda environments found.");

  const shellCode = getCondaShell(env.value);
  if (shellOnly) {
    process.stdout.write(`${shellCode}\n`);
    return;
  }

  printApplyGuide(shellCode);
  showSelectedEnvStatus({ condaEnv: env.label });
}

async function runCudaSetup({ shellOnly = false } = {}) {
  const cuda = await selectFromList("Select CUDA version", getCudaVersions(), {
    getDescription: getItemDescription,
    setDescription: setItemDescription,
  });
  if (!cuda) throw new Error("No CUDA versions found in /usr/local.");

  const shellCode = getCudaShell(cuda.value);
  if (shellOnly) {
    process.stdout.write(`${shellCode}\n`);
    return;
  }

  printApplyGuide(shellCode);
  showSelectedEnvStatus({ cudaVersion: `${cuda.label} (${cuda.value})` });
}

async function runDescriptionEditor() {
  const items = [
    ...getCondaEnvs().map((item) => ({ ...item, group: "conda" })),
    ...getCudaVersions().map((item) => ({ ...item, group: "cuda" })),
  ];

  await editDescriptionMenu(items, {
    getDescription: getItemDescription,
    setDescription: setItemDescription,
  });
}

async function selectTarget(target) {
  const selectedTarget = target ? target.toLowerCase() : "";

  if (selectedTarget === "conda") {
    await runCondaSetup({ shellOnly: true });
    return;
  }

  if (selectedTarget === "cuda") {
    await runCudaSetup({ shellOnly: true });
    return;
  }

  const choice = await selectFromList("What do you want to configure?", [
    { label: "conda", value: "conda" },
    { label: "cuda", value: "cuda" },
  ]);

  if (!choice) throw new Error("Nothing selected.");
  await selectTarget(choice.value);
}

async function runCliLoop() {
  showBanner();
  showCurrentPath();

  while (true) {
    const input = await ask(`${COLOR.white}ENV_CLI ${COLOR.crimson}>> ${COLOR.reset}`);

    try {
      if (input === "/conda") {
        await runCondaSetup();
        showCurrentPath();
        continue;
      }

      if (input === "/cuda") {
        await runCudaSetup();
        showCurrentPath();
        continue;
      }

      if (input === "/desc") {
        await runDescriptionEditor();
        showCurrentEnvStatus();
        showCurrentPath();
        continue;
      }

      if (input === "/help") {
        showHelp();
        showCurrentPath();
        continue;
      }

      if (input === "/exit") {
        console.log(`${COLOR.bold}${COLOR.crimson}CLI를 종료합니다.${COLOR.reset}`);
        process.exit(0);
      }

      console.log(`${COLOR.red}알 수 없는 명령어입니다.${COLOR.reset}\n`);
      showCurrentPath();
    } catch (error) {
      console.error(`${COLOR.red}${error.message}${COLOR.reset}`);
      showCurrentPath();
    }
  }
}

async function main() {
  const [command, target] = process.argv.slice(2);

  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "init") {
    showInit();
    return;
  }

  if (command === "setup") {
    setupShellIntegration(cliEntryPath);
    return;
  }

  if (command === "doctor") {
    printDoctor({ condaEnvs: getCondaEnvs(), cudaVersions: getCudaVersions() });
    return;
  }

  if (command === "select") {
    await selectTarget(target);
    return;
  }

  if (command === "conda") {
    await runCondaSetup({ shellOnly: true });
    return;
  }

  if (command === "cuda") {
    await runCudaSetup({ shellOnly: true });
    return;
  }

  if (!command) {
    await runCliLoop();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`${COLOR.red}프로그램 실행 중 오류: ${error.message}${COLOR.reset}`);
  process.exitCode = 1;
});
