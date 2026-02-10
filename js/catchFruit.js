// catchFruit.js
class CatchFruitGame {
  constructor() {
    // 게임 상태
    this.isGameActive = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.timeLeft = 60;
    this.maxTime = 60;

    // 레벨업 알림 관련
    this.showLevelMessage = false;
    this.levelMessageTimer = 0;

    // 플레이어 (바구니)
    this.laneIndex = 1;
    this.player = {
      x: 0,
      y: 350,
      width: 70,
      height: 35,
      color: "#8B4513"
    };

    // 아이템
    this.items = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 1500;

    // 오디오
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    this.addKeyboardListeners();
  }

  addKeyboardListeners() {
    window.addEventListener("keydown", (event) => {
      if (!this.isGameActive) return;

      if (event.code === "ArrowLeft") {
        this.laneIndex = Math.max(0, this.laneIndex - 1);
      } else if (event.code === "ArrowRight") {
        this.laneIndex = Math.min(2, this.laneIndex + 1);
      }
    });
  }

  start() {
    this.isGameActive = true;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.timeLeft = 60;
    this.maxTime = 60;
    this.items = [];
    this.laneIndex = 1;
    this.lastSpawnTime = Date.now();

    this.timerInterval = setInterval(() => {
      if (this.isGameActive) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.gameOver("Time Over!");
        }
      }
    }, 1000);

    console.log("Game Started: Enhanced Level System");
  }

  stop() {
    this.isGameActive = false;
    clearInterval(this.timerInterval);
  }

  gameOver(reason) {
    this.stop();
    alert(`Game Over! (${reason})\nFinal Score: ${this.score}`);
    location.reload();
  }

  onPoseDetected(poseName) {
    // 키보드 모드 사용 안 함
  }

  update(canvasWidth, canvasHeight) {
    if (!this.isGameActive) return;

    // --- 1. 플레이어 위치 ---
    const laneWidth = canvasWidth / 3;
    const laneCenters = [
      laneWidth * 0.5,
      laneWidth * 1.5,
      laneWidth * 2.5
    ];
    const targetX = laneCenters[this.laneIndex];
    this.player.x = targetX - this.player.width / 2;

    // --- 2. 아이템 생성 ---
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnItem(canvasWidth);
      this.lastSpawnTime = now;
    }

    // --- 3. 아이템 이동 ---
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.y += item.speed;

      if (item.y > canvasHeight) {
        this.items.splice(i, 1);
        continue;
      }

      if (
        item.x < this.player.x + this.player.width &&
        item.x + item.width > this.player.x &&
        item.y < this.player.y + this.player.height &&
        item.y + item.height > this.player.y
      ) {
        this.handleCollision(item);
        this.items.splice(i, 1);
      }
    }

    // --- 4. 레벨업 메시지 타이머 ---
    if (this.showLevelMessage) {
      this.levelMessageTimer--;
      if (this.levelMessageTimer <= 0) {
        this.showLevelMessage = false;
      }
    }
  }

  spawnItem(canvasWidth) {
    const types = [
      { type: "apple", score: 100, label: "🍎", baseSpeed: 3.0 },
      { type: "banana", score: 150, label: "🍌", baseSpeed: 4.0 },
      { type: "grape", score: 200, label: "🍇", baseSpeed: 3.5 },
      { type: "orange", score: 120, label: "🍊", baseSpeed: 3.2 },
      { type: "bomb", score: 0, label: "💣", baseSpeed: 4.5 }
    ];

    // 레벨에 따른 폭탄 확률 조정
    // 레벨 1~2: 20%, 레벨 3~5: 30%, 레벨 6+: 40%
    let bombChance = 0.2;
    if (this.level >= 6) bombChance = 0.4;
    else if (this.level >= 3) bombChance = 0.3;

    let selectedType;
    if (Math.random() < bombChance) {
      selectedType = types[4];
    } else {
      selectedType = types[Math.floor(Math.random() * 4)];
    }

    const laneWidth = canvasWidth / 3;
    const laneIndex = Math.floor(Math.random() * 3);
    const laneCenter = laneWidth * (laneIndex + 0.5);
    const itemSize = 40;

    const finalSpeed = selectedType.baseSpeed + (this.level * 0.2);

    this.items.push({
      x: laneCenter - itemSize / 2,
      y: -40,
      width: itemSize,
      height: itemSize,
      type: selectedType.type,
      score: selectedType.score,
      label: selectedType.label,
      speed: finalSpeed
    });
  }

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

  checkLevelUp() {
    // 500점 단위로 레벨업
    const nextLevelScore = this.level * 500;

    if (this.score >= nextLevelScore) {
      this.level++;
      this.spawnInterval = Math.max(400, 1500 - (this.level * 100));

      // 레벨업 알림 표시 (약 2초간: 60프레임 기준 120프레임)
      this.showLevelMessage = true;
      this.levelMessageTimer = 120;

      // 레벨업 효과음 (간단한 비프음)
      this.playLevelUpSound();

      // 시간 조금 추가 보너스 (+5초)
      this.timeLeft = Math.min(this.maxTime, this.timeLeft + 5);
    }
  }

  playBoomSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }

  playLevelUpSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "sine";
    // 띠링~ 소리 구현
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }

  draw(ctx) {
    if (!this.isGameActive) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const laneWidth = canvasWidth / 3;

    // 레인
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    ctx.beginPath();
    ctx.moveTo(laneWidth, 0);
    ctx.lineTo(laneWidth, canvasHeight);
    ctx.moveTo(laneWidth * 2, 0);
    ctx.lineTo(laneWidth * 2, canvasHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // 바구니
    ctx.fillStyle = this.player.color;
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(this.player.x + this.player.width, this.player.y);
    ctx.lineTo(this.player.x + this.player.width - 10, this.player.y + this.player.height);
    ctx.lineTo(this.player.x + 10, this.player.y + this.player.height);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = this.player.color;
    ctx.lineWidth = 4;
    ctx.arc(this.player.x + this.player.width / 2, this.player.y, this.player.width / 2 - 5, Math.PI, 0);
    ctx.stroke();

    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.player.x + 20, this.player.y);
    ctx.lineTo(this.player.x + 25, this.player.y + this.player.height);
    ctx.moveTo(this.player.x + this.player.width - 20, this.player.y);
    ctx.lineTo(this.player.x + this.player.width - 25, this.player.y + this.player.height);
    ctx.stroke();

    // 아이템
    ctx.font = "32px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.items.forEach(item => {
      ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height / 2);
    });

    // UI
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const scoreStr = `Score: ${this.score}`;
    const levelStr = `Level: ${this.level}`;
    const livesStr = `Lives: ${"❤️".repeat(this.lives)}`;

    ctx.strokeText(scoreStr, 10, 10);
    ctx.fillText(scoreStr, 10, 10);
    ctx.strokeText(levelStr, 10, 35);
    ctx.fillText(levelStr, 10, 35);
    ctx.strokeText(livesStr, 10, 60);
    ctx.fillText(livesStr, 10, 60);

    // 모래시계
    this.drawHourglass(ctx, canvasWidth - 40, 30, 20, 30);

    // --- 레벨업 알림 그리기 ---
    if (this.showLevelMessage) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, canvasHeight / 2 - 50, canvasWidth, 100);

      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#FFD700"; // 금색
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const msg = `LEVEL UP! ${this.level}`;
      ctx.strokeText(msg, canvasWidth / 2, canvasHeight / 2);
      ctx.fillText(msg, canvasWidth / 2, canvasHeight / 2);

      ctx.font = "20px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Time Bonus +5s", canvasWidth / 2, canvasHeight / 2 + 35);
      ctx.restore();
    }
  }

  drawHourglass(ctx, x, y, width, height) {
    const progress = this.timeLeft / this.maxTime;

    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.moveTo(-width / 2, -height / 2);
    ctx.lineTo(width / 2, -height / 2);
    ctx.lineTo(-width / 2, height / 2);
    ctx.lineTo(width / 2, height / 2);
    ctx.lineTo(-width / 2, -height / 2);
    ctx.stroke();

    if (progress > 0) {
      ctx.fillStyle = "#FFD700";

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-width / 2, -height / 2);
      ctx.lineTo(width / 2, -height / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.clip();

      const fillY = -height / 2 + (height / 2) * (1 - progress);
      ctx.fillRect(-width / 2, fillY, width, height / 2);
      ctx.restore();
    }

    const bottomProgress = 1 - progress;
    if (bottomProgress > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-width / 2, height / 2);
      ctx.lineTo(width / 2, height / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.clip();

      const fillY = height / 2 - (height / 2) * bottomProgress;
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(-width / 2, fillY, width, height / 2);
      ctx.restore();
    }

    ctx.restore();

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    const timeText = Math.ceil(this.timeLeft).toString();
    ctx.strokeText(timeText, x, y + height / 2 + 20);
    ctx.fillText(timeText, x, y + height / 2 + 20);
  }
}

window.CatchFruitGame = CatchFruitGame;
