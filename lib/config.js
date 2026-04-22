const fs = require("fs");
const path = require("path");

const { COLOR } = require("./colors");

function getConfigDir() {
  const configHome = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || process.cwd(), ".config");
  return path.join(configHome, "env-cli");
}

function getDescriptionsPath() {
  return path.join(getConfigDir(), "descriptions.json");
}

function loadDescriptions() {
  const filePath = getDescriptionsPath();
  if (!fs.existsSync(filePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function saveDescriptions(descriptions) {
  try {
    fs.mkdirSync(getConfigDir(), { recursive: true });
    fs.writeFileSync(getDescriptionsPath(), `${JSON.stringify(descriptions, null, 2)}\n`, "utf8");
    return true;
  } catch (error) {
    console.error(`${COLOR.red}설명 저장 실패: ${error.message}${COLOR.reset}`);
    return false;
  }
}

function getItemDescription(item) {
  const descriptions = loadDescriptions();
  return descriptions[item.id] || "";
}

function setItemDescription(item, description) {
  const descriptions = loadDescriptions();
  if (description) {
    descriptions[item.id] = description;
  } else {
    delete descriptions[item.id];
  }
  return saveDescriptions(descriptions);
}

module.exports = {
  getItemDescription,
  setItemDescription,
};
