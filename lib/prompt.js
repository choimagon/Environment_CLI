const readline = require("readline");

const { COLOR } = require("./colors");

const stderr = process.stderr;

function askPlain(message, options = {}) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      completer: options.completer,
    });

    rl.question(message, (answer) => {
      rl.close();
      setImmediate(() => resolve(answer.trim()));
    });
  });
}

function askRawLine(message) {
  return new Promise((resolve) => {
    let value = "";
    stderr.write(message);
    process.stdin.resume();

    const onData = (chunk) => {
      const text = chunk.toString("utf8");

      for (const char of text) {
        const code = char.charCodeAt(0);

        if (char === "\r" || char === "\n") {
          process.stdin.off("data", onData);
          stderr.write("\n");
          resolve(value.trim());
          return;
        }

        if (code === 3) {
          process.stdin.off("data", onData);
          stderr.write("\n");
          resolve("");
          return;
        }

        if (code === 127 || code === 8) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stderr.write("\b \b");
          }
          continue;
        }

        if (code < 32) continue;

        value += char;
        stderr.write(char);
      }
    };

    process.stdin.on("data", onData);
  });
}

function writeError(message) {
  stderr.write(`${message}\n`);
}

async function selectFromList(title, items, { getDescription, setDescription } = {}) {
  if (items.length === 0) return null;
  if (!process.stdin.isTTY || !process.stderr.isTTY) return items[0];

  let index = 0;
  process.stdin.resume();
  process.stdin.setRawMode(true);

  const render = () => {
    stderr.write("\x1b[2J\x1b[H");
    writeError(`${COLOR.bold}${COLOR.crimson}${title}${COLOR.reset}`);
    writeError(`${COLOR.gray}Use ↑/↓, Enter to select, e to edit description.${COLOR.reset}\n`);

    items.forEach((item, itemIndex) => {
      const cursor = itemIndex === index ? ">" : " ";
      const checked = itemIndex === index ? "[x]" : "[ ]";
      const description = getDescription ? getDescription(item) || "설명 입력 필요" : "";
      writeError(`${COLOR.white}${cursor} ${checked} ${item.label}${COLOR.reset}  ${COLOR.gray}: ${description}${COLOR.reset}`);
    });
  };

  return await new Promise((resolve, reject) => {
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.off("data", onData);
      stderr.write("\x1b[2J\x1b[H");
    };

    const onData = (chunk) => {
      const key = chunk.toString("utf8");

      if (key === "\u001b[B") {
        index = (index + 1) % items.length;
        render();
      } else if (key === "\u001b[A") {
        index = (index - 1 + items.length) % items.length;
        render();
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(items[index]);
      } else if (key === "e" && setDescription) {
        process.stdin.off("data", onData);
        stderr.write("\n");
        askRawLine(`${COLOR.white}설명 입력 (${items[index].label}) : ${COLOR.reset}`).then((answer) => {
          setDescription(items[index], answer.trim());
          process.stdin.on("data", onData);
          render();
        }).catch((error) => {
          console.error(`${COLOR.red}설명 입력 실패: ${error.message}${COLOR.reset}`);
          process.stdin.on("data", onData);
          render();
        });
      } else if (key === "\u001b" || key === "\u0003") {
        cleanup();
        reject(new Error("cancelled"));
      }
    };

    process.stdin.on("data", onData);
    render();
  });
}

async function editDescriptionMenu(items, { getDescription, setDescription }) {
  if (items.length === 0) {
    console.log(`${COLOR.red}수정할 conda/CUDA 항목을 찾지 못했습니다.${COLOR.reset}`);
    return;
  }

  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    console.log(`${COLOR.red}/desc는 대화형 터미널에서만 사용할 수 있습니다.${COLOR.reset}`);
    return;
  }

  let index = 0;
  process.stdin.resume();
  process.stdin.setRawMode(true);

  const render = () => {
    stderr.write("\x1b[2J\x1b[H");
    writeError(`${COLOR.bold}${COLOR.crimson}Edit descriptions${COLOR.reset}`);
    writeError(`${COLOR.gray}Use ↑/↓, Enter to edit, Esc to finish.${COLOR.reset}\n`);

    items.forEach((item, itemIndex) => {
      const cursor = itemIndex === index ? ">" : " ";
      const checked = itemIndex === index ? "[x]" : "[ ]";
      const description = getDescription(item) || "설명 입력 필요";
      writeError(`${COLOR.white}${cursor} ${checked} ${item.group}/${item.label}${COLOR.reset}  ${COLOR.gray}: ${description}${COLOR.reset}`);
    });
  };

  await new Promise((resolve) => {
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.off("data", onData);
      stderr.write("\x1b[2J\x1b[H");
    };

    const askDescription = () => {
      process.stdin.off("data", onData);
      stderr.write("\n");
      askRawLine(`${COLOR.white}설명 입력 (${items[index].group}/${items[index].label}) : ${COLOR.reset}`).then((answer) => {
        setDescription(items[index], answer.trim());
        process.stdin.on("data", onData);
        render();
      }).catch((error) => {
        console.error(`${COLOR.red}설명 입력 실패: ${error.message}${COLOR.reset}`);
        process.stdin.on("data", onData);
        render();
      });
    };

    const onData = (chunk) => {
      const key = chunk.toString("utf8");

      if (key === "\u001b[B") {
        index = (index + 1) % items.length;
        render();
      } else if (key === "\u001b[A") {
        index = (index - 1 + items.length) % items.length;
        render();
      } else if (key === "\r" || key === "\n") {
        askDescription();
      } else if (key === "\u001b" || key === "\u0003") {
        cleanup();
        resolve();
      }
    };

    process.stdin.on("data", onData);
    render();
  });
}

module.exports = {
  askPlain,
  editDescriptionMenu,
  selectFromList,
};
