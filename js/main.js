/**
 * main.js
 * Catch Fruit 게임 구동을 위한 메인 스크립트 (배경 이미지 적용)
 */

let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;
let backgroundImage; // 배경 이미지 변수

async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const canvas = document.getElementById("canvas");

  startBtn.disabled = true;

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

    // 1. Pose Model 로드 (키보드 모드여도 코드는 유지)
    // (웹캠 권한은 여전히 요청할 수 있음)
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

    // 3. Game Engine 초기화
    gameEngine = new GameEngine();

    // 4. Canvas 설정
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

    // 7. 게임 시작
    // poseEngine.start(); // 키보드 모드에서는 굳이 Webcam 루프를 안 돌려도 되지만, 에러 방지용으로 둠
    gameEngine.start();

    // 8. 게임 루프 시작
    window.requestAnimationFrame(loop);

    stopBtn.disabled = false;

  } catch (error) {
    console.error("초기화 실패:", error);
    alert("초기화 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    startBtn.disabled = false;
  }
}

function stop() {
  if (poseEngine) poseEngine.stop();
  if (gameEngine) gameEngine.stop();

  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
  location.reload();
}

function handlePrediction(predictions) {
  // 키보드 모드이므로 포즈 인식 결과는 로깅만 하거나 무시
  // const stabilized = stabilizer.stabilize(predictions);
}

/**
 * 메인 게임 루프 (60FPS)
 */
function loop(timestamp) {
  if (!gameEngine || !gameEngine.isGameActive) return;

  // 1. 배경 이미지 그리기
  if (backgroundImage && backgroundImage.complete) {
    ctx.globalAlpha = 1.0; // 불투명하게
    ctx.drawImage(backgroundImage, 0, 0, 400, 400);
  } else {
    // 이미지가 없으면 흰 배경
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 400);
  }

  // 2. GameEngine 업데이트 
  gameEngine.update(400, 400);

  // 3. GameEngine 그리기 
  gameEngine.draw(ctx);

  // 4. 다음 프레임 요청
  window.requestAnimationFrame(loop);
}
