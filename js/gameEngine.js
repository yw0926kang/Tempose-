/**
 * gameEngine.js
 * Catch Fruit 게임 로직 (3 Lane 시스템으로 변경)
 */

class GameEngine {
  constructor() {
    // 게임 상태
    this.isGameActive = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.timeLeft = 60;

    // 1. 플레이어 (바구니) - 3 Lane 설정
    this.player = {
      x: 0, // 나중에 계산
      y: 350, // 바닥 부근
      width: 70, // 바구니 크기 약간 키움
      height: 35,
      color: "#8B4513" // 갈색 (SaddleBrown)
    };
    this.currentPose = "Center"; // 현재 인식된 포즈

    // 아이템 (과일, 폭탄)
    this.items = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 1500; // 1.5초마다 생성

    // 오디오 (Web Audio API)
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  /**
   * 게임 시작
   */
  start() {
    this.isGameActive = true;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.timeLeft = 60;
    this.items = [];
    this.lastSpawnTime = Date.now();

    // 타이머 시작
    this.timerInterval = setInterval(() => {
      if (this.isGameActive) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.gameOver("Time Over!");
        }
      }
    }, 1000);

    console.log("Game Started: 3-Lane Mode");
  }

  /**
   * 게임 종료
   */
  stop() {
    this.isGameActive = false;
    clearInterval(this.timerInterval);
  }

  /**
   * 게임 오버 처리
   */
  gameOver(reason) {
    this.stop();
    alert(`Game Over! (${reason})\nFinal Score: ${this.score}`);
    location.reload();
  }

  /**
   * 포즈 인식 결과 반영 (외부에서 호출)
   * @param {string} poseName - "Left", "Right", "Center"
   */
  onPoseDetected(poseName) {
    this.currentPose = poseName;
  }

  /**
   * 게임 상태 업데이트 (매 프레임 호출)
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  update(canvasWidth, canvasHeight) {
    if (!this.isGameActive) return;

    // --- 1. 플레이어 위치 계산 (3 Lane) ---
    // 화면을 3등분하여 각 레인의 중심점 계산
    const laneWidth = canvasWidth / 3;
    const laneCenters = [
      laneWidth * 0.5, // 왼쪽 레인 중심
      laneWidth * 1.5, // 가운데 레인 중심
      laneWidth * 2.5  // 오른쪽 레인 중심
    ];

    let targetX = laneCenters[1]; // 기본: 가운데 (Center)

    if (this.currentPose === "Left") {
      targetX = laneCenters[0]; // 왼쪽으로 이동
    } else if (this.currentPose === "Right") {
      targetX = laneCenters[2]; // 오른쪽으로 이동
    }
    // "Center"일 때는 이미 laneCenters[1]로 설정됨

    // 바구니 중심을 해당 레인 중심에 맞춤
    this.player.x = targetX - this.player.width / 2;

    // --- 2. 아이템 생성 ---
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnItem(canvasWidth);
      this.lastSpawnTime = now;
    }

    // --- 3. 아이템 이동 및 충돌 ---
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.y += item.speed;

      // 바닥에 닿으면 제거
      if (item.y > canvasHeight) {
        this.items.splice(i, 1);
        continue;
      }

      // 충돌 체크 (간단한 사각형 겹침 판정 AABB)
      if (
        item.x < this.player.x + this.player.width &&
        item.x + item.width > this.player.x &&
        item.y < this.player.y + this.player.height &&
        item.y + item.height > this.player.y
      ) {
        // 충돌 발생!
        this.handleCollision(item);
        this.items.splice(i, 1);
      }
    }
  }

  /**
   * 랜덤 아이템 생성 (3 Lane 중 하나 선택)
   */
  spawnItem(canvasWidth) {
    // 1. 아이템 종류 정의
    const types = [
      { type: "apple", score: 100, label: "🍎", speed: 2.5 + this.level * 0.3 },
      { type: "banana", score: 150, label: "🍌", speed: 3.5 + this.level * 0.3 }, // 빠름
      { type: "grape", score: 200, label: "🍇", speed: 3.0 + this.level * 0.3 },
      { type: "orange", score: 120, label: "🍊", speed: 2.8 + this.level * 0.3 },
      { type: "bomb", score: 0, label: "💣", speed: 4.0 + this.level * 0.3 }    // 폭탄 (빠름)
    ];

    // 2. 종류 선택 (폭탄 25%, 나머지 과일)
    let selectedType;
    if (Math.random() < 0.25) {
      selectedType = types[4]; // 폭탄
    } else {
      selectedType = types[Math.floor(Math.random() * 4)]; // 과일 중 하나
    }

    // 3. 레인 선택 (0, 1, 2 중 하나)
    const laneWidth = canvasWidth / 3;
    const laneIndex = Math.floor(Math.random() * 3);
    const laneCenter = laneWidth * (laneIndex + 0.5);

    const itemSize = 40; // 아이템 크기

    // 4. 아이템 객체 생성 및 추가
    this.items.push({
      x: laneCenter - itemSize / 2, // 레인 정중앙에 배치
      y: -40, // 화면 위에서 시작
      width: itemSize,
      height: itemSize,
      ...selectedType
    });
  }

  /**
   * 충돌 처리 핸들러
   */
  handleCollision(item) {
    if (item.type === "bomb") {
      this.lives--;
      this.playBoomSound();
      if (this.lives <= 0) {
        this.gameOver("No lives left!");
      }
    } else {
      this.score += item.score;
      this.checkLevelUp();
    }
  }

  /**
   * 레벨업 처리
   */
  checkLevelUp() {
    if (this.score >= this.level * 500) {
      this.level++;
      // 레벨업 시 생성 속도 빨라짐 (최소 0.5초)
      this.spawnInterval = Math.max(500, 1500 - (this.level * 100));
    }
  }

  /**
   * 폭탄 사운드 재생
   */
  playBoomSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sawtooth"; // 톱니파 (거친 소리)
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }

  /**
   * 화면 그리기 (최종 렌더링)
   */
  draw(ctx) {
    if (!this.isGameActive) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const laneWidth = canvasWidth / 3;

    // [배경] 레인 구분선 그리기 (점선)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // 반투명 흰색
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]); // 점선 패턴

    ctx.beginPath();
    // 첫 번째 선 (왼쪽/가운데 구분)
    ctx.moveTo(laneWidth, 0);
    ctx.lineTo(laneWidth, canvasHeight);
    // 두 번째 선 (가운데/오른쪽 구분)
    ctx.moveTo(laneWidth * 2, 0);
    ctx.lineTo(laneWidth * 2, canvasHeight);
    ctx.stroke();

    ctx.setLineDash([]); // 점선 설정 초기화

    // [바구니] 플레이어 그리기 (갈색 소풍 바구니)
    ctx.fillStyle = this.player.color;

    // 1. 몸통 (사다리꼴)
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y); // 좌상단
    ctx.lineTo(this.player.x + this.player.width, this.player.y); // 우상단
    ctx.lineTo(this.player.x + this.player.width - 10, this.player.y + this.player.height); // 우하단
    ctx.lineTo(this.player.x + 10, this.player.y + this.player.height); // 좌하단
    ctx.closePath();
    ctx.fill();

    // 2. 손잡이 (반원 아치)
    ctx.beginPath();
    ctx.strokeStyle = this.player.color;
    ctx.lineWidth = 4;
    ctx.arc(
      this.player.x + this.player.width / 2, // 중심 X
      this.player.y,                         // 중심 Y (몸통 윗면)
      this.player.width / 2 - 5,             // 반지름
      Math.PI, 0                             // 180도 -> 0도 (반원)
    );
    ctx.stroke();

    // 3. 바구니 질감 (체크 무늬 느낌)
    ctx.strokeStyle = "#5D4037"; // 진한 갈색
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 세로줄 2개
    ctx.moveTo(this.player.x + 20, this.player.y);
    ctx.lineTo(this.player.x + 25, this.player.y + this.player.height);
    ctx.moveTo(this.player.x + this.player.width - 20, this.player.y);
    ctx.lineTo(this.player.x + this.player.width - 25, this.player.y + this.player.height);
    ctx.stroke();

    // [아이템] 과일/폭탄 그리기 (이모지)
    ctx.font = "32px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.items.forEach(item => {
      ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height / 2);
    });

    // [UI] 점수 및 정보 그리기
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top"; // 상단 기준 정렬

    // 텍스트 내용
    const scoreStr = `Score: ${this.score}`;
    const levelStr = `Level: ${this.level}`;
    const livesStr = `Lives: ${"❤️".repeat(this.lives)}`;
    const timeStr = `Time: ${this.timeLeft}`;

    // 외곽선(Stroke) + 채우기(Fill)로 가독성 확보
    function drawTextWithOutline(text, x, y) {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }

    drawTextWithOutline(scoreStr, 10, 10);
    drawTextWithOutline(levelStr, 10, 35);
    drawTextWithOutline(livesStr, 10, 60);

    // 시간은 오른쪽 상단에 배치
    const timeWidth = ctx.measureText(timeStr).width;
    drawTextWithOutline(timeStr, canvasWidth - timeWidth - 10, 10);
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;
