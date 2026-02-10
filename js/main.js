/**
 * main.js
 * Catch Fruit 게임 구동을 위한 메인 스크립트
 */

let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  startBtn.disabled = true;

  try {
    // 1. Pose Model 로드
    poseEngine = new PoseEngine("./my_model/");
    const { maxPredictions } = await poseEngine.init({
      size: 400, // 캔버스 크기 확대 (게임성 위해)
      flip: true
    });

    // 2. Stabilizer 초기화 (포즈 인식 안정화)
    stabilizer = new PredictionStabilizer({
      threshold: 0.85, // 확실한 동작만 인정
      smoothingFrames: 5 // 부드러운 전환
    });

    // 3. Game Engine 초기화
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

    // 7. 게임 시작
    poseEngine.start();
    gameEngine.start();

    // 8. 게임 루프 시작
    window.requestAnimationFrame(loop);

    stopBtn.disabled = false;

  } catch (error) {
    console.error("초기화 실패:", error);
    alert("모델 로딩에 실패했습니다. 경로를 확인해주세요.");
    startBtn.disabled = false;
  }
}

function stop() {
  if (poseEngine) poseEngine.stop();
  if (gameEngine) gameEngine.stop();

  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
  location.reload(); // 깔끔한 리셋을 위해 새로고침
}

function handlePrediction(predictions) {
  // 포즈 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 라벨 컨테이너 업데이트 (디버깅용)
  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // 가장 확률 높은 포즈 표시
  const maxPredictionDiv = document.getElementById("max-prediction");
  if (stabilized.className) {
    maxPredictionDiv.innerHTML = stabilized.className;
    // GameEngine에 포즈 전달 -> 바구니 이동
    gameEngine.onPoseDetected(stabilized.className);
  }
}

/**
 * 메인 게임 루프 (60FPS)
 */
function loop(timestamp) {
  if (!gameEngine || !gameEngine.isGameActive) return;

  // 1. PoseEngine 웹캠 그리기
  if (poseEngine.webcam && poseEngine.webcam.canvas) {
    ctx.globalAlpha = 0.5; // 반투명하게 (게임 요소 잘 보이게)
    ctx.drawImage(poseEngine.webcam.canvas, 0, 0, 400, 400);
    ctx.globalAlpha = 1.0;
  }

  // 2. GameEngine 업데이트 (이동, 충돌 계산)
  gameEngine.update(400, 400);

  // 3. GameEngine 그리기 (바구니, 과일)
  gameEngine.draw(ctx);

  // 4. 다음 프레임 요청
  window.requestAnimationFrame(loop);
}
