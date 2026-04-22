const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getCondaEnvs() {
  try {
    const raw = execFileSync("conda", ["env", "list", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const parsed = JSON.parse(raw);
    return (parsed.envs || []).map((envPath) => {
      const name = path.basename(envPath);
      const isBase = !envPath.includes(`${path.sep}envs${path.sep}`);
      return {
        id: `conda:${envPath}`,
        label: isBase ? `base (${name})` : name,
        value: envPath,
        detail: envPath,
      };
    });
  } catch {
    try {
      const raw = execFileSync("conda", ["env", "list"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.replace("*", "").trim().split(/\s+/))
        .filter((parts) => parts.length >= 1)
        .map((parts) => {
          const envPath = parts[parts.length - 1] || "";
          const value = path.isAbsolute(envPath) ? envPath : parts[0];
          return {
            id: `conda:${value}`,
            label: parts[0],
            value,
            detail: envPath,
          };
        });
    } catch {
      return [];
    }
  }
}

function safeRealpath(target) {
  try {
    return fs.realpathSync(target);
  } catch {
    return "";
  }
}

function detectCudaVersion(cudaPath, fallbackName) {
  const versionFile = path.join(cudaPath, "version.json");

  if (fs.existsSync(versionFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(versionFile, "utf8"));
      if (parsed.cuda && parsed.cuda.version) return `cuda-${parsed.cuda.version}`;
    } catch {
      // Fall back to directory name below.
    }
  }

  if (fallbackName === "cuda") return "cuda";
  return fallbackName;
}

function getCudaVersions() {
  const root = "/usr/local";
  const seen = new Set();
  const versions = [];

  if (!fs.existsSync(root)) return versions;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (!/^cuda(?:-\d+(?:\.\d+)*)?$/.test(entry.name)) continue;

    const cudaPath = path.join(root, entry.name);
    const realPath = safeRealpath(cudaPath);
    const key = realPath || cudaPath;

    if (seen.has(key)) continue;
    seen.add(key);

    versions.push({
      id: `cuda:${cudaPath}`,
      label: detectCudaVersion(cudaPath, entry.name),
      value: cudaPath,
      detail: realPath && realPath !== cudaPath ? `${cudaPath} -> ${realPath}` : cudaPath,
    });
  }

  return versions.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

function getCurrentCondaEnv() {
  if (process.env.CONDA_DEFAULT_ENV) return process.env.CONDA_DEFAULT_ENV;
  if (process.env.CONDA_PREFIX) return path.basename(process.env.CONDA_PREFIX);
  return "none";
}

function getCurrentCudaInfo() {
  const cudaPath = process.env.CUDA_HOME || process.env.CUDA_PATH || "";
  const fromPath = cudaPath ? detectCudaVersion(cudaPath, path.basename(cudaPath)) : "";

  if (cudaPath) return `${fromPath} (${cudaPath})`;

  try {
    const raw = execFileSync("nvcc", ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const match = raw.match(/release\s+([\d.]+)/);
    if (match) return `cuda-${match[1]} (nvcc)`;
    return "detected by nvcc";
  } catch {
    return "none";
  }
}

module.exports = {
  detectCudaVersion,
  getCondaEnvs,
  getCudaVersions,
  getCurrentCondaEnv,
  getCurrentCudaInfo,
};
