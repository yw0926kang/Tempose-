/**
 * main.js
 * Catch Fruit 게임과 Jungle Survival 게임을 통합 관리하는 메인 스크립트
 */

let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;
let backgroundImage; // 배경 이미지 변수
let isInitialized = false; // 초기화 여부

// 초기화 함수 (한 번만 실행됨)
async function init() {
  if (isInitialized) return Promise.resolve();

  const stopBtn = document.getElementById("stopBtn");

  try {
    // 0. 배경 이미지 로드
    backgroundImage = new Image();
    backgroundImage.src = "./assets/background.jpg";

    // 이미지가 로드될 때까지 기다림 (Promise)
    await new Promise((resolve, reject) => {
      backgroundImage.onload = resolve;
      backgroundImage.onerror = () => {
        console.error("배경 이미지 로드 실패");
        resolve(); // 실패해도 게임은 진행
      };
    });

    // 1. Pose Model 로드
    poseEngine = new PoseEngine("./my_model/");
    const { maxPredictions } = await poseEngine.init({
      size: 400,
      flip: true
    });

    // 2. Stabilizer 초기화
    stabilizer = new PredictionStabilizer({
      threshold: 0.85,
      smoothingFrames: 5
    });

    // 3. Game Engine 초기화 (Manager)
    gameEngine = new GameEngine();

    // 4. Canvas 설정
    const canvas = document.getElementById("canvas");
    canvas.width = 400;
    canvas.height = 400;
    ctx = canvas.getContext("2d");

    // 5. Label Container 초기화
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    // 6. PoseEngine 콜백 연결
    poseEngine.setPredictionCallback(handlePrediction);

    // 7. PoseEngine 시작 (키보드 게임이라도 일단 켜둠)
    poseEngine.start();

    // 8. 게임 루프 시작
    window.requestAnimationFrame(loop);

    stopBtn.disabled = false;
    isInitialized = true;
    console.log("Engine Initialized");

  } catch (error) {
    console.error("초기화 실패:", error);
    alert("초기화 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
  }
}

/**
 * 게임 선택 및 시작 (HTML 버튼에서 호출)
 * @param {string} gameType - 'catchFruit' 또는 'jungle'
 */
async function selectGame(gameType) {
  // 엔진이 초기화되지 않았다면 먼저 초기화
  if (!isInitialized) {
    await init();
  }

  if (gameEngine) {
    gameEngine.selectGame(gameType);
  }
}

function stop() {
  if (poseEngine) poseEngine.stop();
  if (gameEngine) gameEngine.stopGame();

  document.getElementById("stopBtn").disabled = true;
  location.reload();
}

function handlePrediction(predictions) {
  // 포즈 인식 결과를 GameEngine으로 전달 (Delegate)
  const stabilized = stabilizer.stabilize(predictions);

  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  const maxPredictionDiv = document.getElementById("max-prediction");
  if (stabilized.className) {
    maxPredictionDiv.innerHTML = stabilized.className;
    // GameEngine에게 포즈 전달 -> 현재 활성화된 게임으로 전달됨
    if (gameEngine) {
      gameEngine.onPoseDetected(stabilized.className);
    }
  }
}

/**
 * 메인 게임 루프 (60FPS)
 */
function loop(timestamp) {
  // 1. 배경 이미지 그리기
  if (backgroundImage && backgroundImage.complete) {
    ctx.globalAlpha = 1.0;
    ctx.drawImage(backgroundImage, 0, 0, 400, 400);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 400);
  }

  if (gameEngine) {
    // 2. GameEngine 업데이트 
    gameEngine.update(400, 400);

    // 3. GameEngine 그리기 
    gameEngine.draw(ctx);
  }

  // 4. 다음 프레임 요청
  window.requestAnimationFrame(loop);
}
