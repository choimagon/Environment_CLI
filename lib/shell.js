function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function getCondaShell(envPath) {
  return `conda activate ${shellQuote(envPath)}`;
}

function getCudaShell(cudaPath) {
  return [
    `export CUDA_HOME=${shellQuote(cudaPath)}`,
    `export CUDA_PATH=${shellQuote(cudaPath)}`,
    'case ":$PATH:" in',
    `  *":${cudaPath}/bin:"*) ;;`,
    `  *) export PATH="${cudaPath}/bin:$PATH" ;;`,
    "esac",
    'case ":${LD_LIBRARY_PATH:-}:" in',
    `  *":${cudaPath}/lib64:"*) ;;`,
    `  *) export LD_LIBRARY_PATH="${cudaPath}/lib64\${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" ;;`,
    "esac",
  ].join("\n");
}

module.exports = {
  getCondaShell,
  getCudaShell,
  shellQuote,
};
