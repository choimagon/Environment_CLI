const { COLOR } = require("./colors");
const { getCurrentCondaEnv, getCurrentCudaInfo } = require("./detect");

function showBanner() {
  console.clear();

  const banner = `
${COLOR.bold}${COLOR.crimson}┌──────────────────────────────────────────────────────────────┐${COLOR.reset}
${COLOR.bold}${COLOR.crimson}│${COLOR.white}                     Welcome to ENV_CLI                       ${COLOR.reset}${COLOR.bold}${COLOR.crimson}│${COLOR.reset}
${COLOR.bold}${COLOR.crimson}└──────────────────────────────────────────────────────────────┘${COLOR.reset}
${COLOR.gray}only Linux                                        made by choi${COLOR.reset}
`;
  console.log(banner);
  showCurrentEnvStatus();
}

function showHelp() {
  console.log(`
${COLOR.bold}${COLOR.crimson}==================== 명령어 리스트 ====================${COLOR.reset}

${COLOR.white}/conda${COLOR.reset}      : conda env 목록을 보고 선택합니다.
${COLOR.white}/cuda${COLOR.reset}       : 설치된 CUDA 버전 목록을 보고 선택합니다.
${COLOR.white}/desc${COLOR.reset}       : conda/CUDA 항목 설명을 수정합니다.
${COLOR.white}/help${COLOR.reset}       : 사용 가능한 명령어 목록을 보여줍니다.
${COLOR.white}/exit${COLOR.reset}       : CLI를 종료합니다.

${COLOR.gray}Tab으로 명령어를 자동완성할 수 있습니다.${COLOR.reset}
${COLOR.gray}선택 메뉴에서 e를 누르면 현재 항목 설명을 수정합니다.${COLOR.reset}

${COLOR.bold}${COLOR.crimson}======================================================${COLOR.reset}
`);
}

function showCurrentPath() {
  console.log(`${COLOR.gray}path : ${process.cwd()}${COLOR.reset}`);
}

function showCurrentEnvStatus() {
  console.log(`${COLOR.bold}${COLOR.crimson}현재 환경${COLOR.reset}`);
  console.log(`${COLOR.white}conda${COLOR.reset} : ${COLOR.green}${getCurrentCondaEnv()}${COLOR.reset}`);
  console.log(`${COLOR.white}cuda ${COLOR.reset} : ${COLOR.green}${getCurrentCudaInfo()}${COLOR.reset}`);
  console.log(`${COLOR.bold}${COLOR.crimson}────────────────────────────────────────────────────────────────${COLOR.reset}`);
}

function showSelectedEnvStatus({ condaEnv, cudaVersion } = {}) {
  console.log(`${COLOR.bold}${COLOR.crimson}현재 환경${COLOR.reset}`);
  console.log(`${COLOR.white}conda${COLOR.reset} : ${COLOR.green}${condaEnv || getCurrentCondaEnv()}${COLOR.reset}`);
  console.log(`${COLOR.white}cuda ${COLOR.reset} : ${COLOR.green}${cudaVersion || getCurrentCudaInfo()}${COLOR.reset}`);
  console.log(`${COLOR.bold}${COLOR.crimson}────────────────────────────────────────────────────────────────${COLOR.reset}`);
}

function printDoctor({ condaEnvs, cudaVersions }) {
  console.log(`\n${COLOR.bold}${COLOR.crimson}Conda environments${COLOR.reset}`);
  if (condaEnvs.length === 0) console.log(`${COLOR.gray}  none found${COLOR.reset}`);
  for (const env of condaEnvs) console.log(`${COLOR.white}  ${env.label}${COLOR.reset}  ${COLOR.gray}${env.detail}${COLOR.reset}`);

  console.log(`\n${COLOR.bold}${COLOR.crimson}CUDA versions${COLOR.reset}`);
  if (cudaVersions.length === 0) console.log(`${COLOR.gray}  none found${COLOR.reset}`);
  for (const cuda of cudaVersions) console.log(`${COLOR.white}  ${cuda.label}${COLOR.reset}  ${COLOR.gray}${cuda.detail}${COLOR.reset}`);
  console.log("");
}

module.exports = {
  printDoctor,
  showBanner,
  showCurrentEnvStatus,
  showCurrentPath,
  showHelp,
  showSelectedEnvStatus,
};
