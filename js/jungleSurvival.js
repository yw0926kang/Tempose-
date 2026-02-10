/**
 * jungleSurvival.js
 * 정글에서 살아남기 게임 로직 (동물 추가 + 사이즈 확대)
 */

class JungleSurvivalGame {
    constructor() {
        // 게임 상태
        this.isGameActive = false;
        this.score = 0;
        this.lives = 3;
        this.speed = 5;

        // 플레이어 상태
        this.player = {
            x: 50,
            y: 300,
            width: 60,     // 플레이어 크기 확대
            height: 90,    // 플레이어 크기 확대
            baseY: 300,
            state: "Run",
            jumpVelocity: 0,
            gravity: 0.8,
            jumpPower: -15
        };

        this.isDucking = false;

        // 배경 이미지
        this.bgImage = new Image();
        this.bgImage.src = "./assets/jungle_bg.jpg";
        this.bgX = 0;

        // 장애물 목록
        this.obstacles = [];
        this.obstacleTimer = 0;

        // 점수 타이머
        this.scoreTimer = null;

        // 오디오
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.addKeyboardListeners();
    }

    addKeyboardListeners() {
        window.addEventListener("keydown", (event) => {
            if (!this.isGameActive) return;

            if (event.code === "Space" || event.code === "ArrowUp") {
                this.jump();
            }
            if (event.code === "ArrowDown") {
                this.duck(true);
            }
        });

        window.addEventListener("keyup", (event) => {
            if (!this.isGameActive) return;

            if (event.code === "ArrowDown") {
                this.duck(false);
            }
        });
    }

    jump() {
        if (this.player.y >= this.player.baseY && this.player.state !== "Jump") {
            this.player.state = "Jump";
            this.player.jumpVelocity = this.player.jumpPower;
            this.isDucking = false;
            this.playSound("jump");
        }
    }

    duck(isDown) {
        if (this.player.state === "Jump") return;

        this.isDucking = isDown;

        if (isDown) {
            this.player.state = "Duck";
            this.player.height = 50; // 숙였을 때 높이
            this.player.y = this.player.baseY + 40;
        } else {
            this.player.state = "Run";
            this.player.height = 90;
            this.player.y = this.player.baseY;
        }
    }

    start() {
        this.isGameActive = true;
        this.score = 0;
        this.lives = 3;
        this.speed = 5;
        this.obstacles = [];
        this.player.y = this.player.baseY;
        this.player.state = "Run";
        this.obstacleTimer = 0;
        this.isDucking = false;

        if (this.scoreTimer) clearInterval(this.scoreTimer);
        this.scoreTimer = setInterval(() => {
            if (this.isGameActive) {
                this.score += 10;
                if (this.score % 100 === 0) {
                    this.speed += 0.2;
                }
            }
        }, 1000);

        console.log("Jungle Survival Started: More Animals & Bigger Size!");
    }

    stop() {
        this.isGameActive = false;
        if (this.scoreTimer) clearInterval(this.scoreTimer);
    }

    gameOver() {
        this.stop();
        alert(`Game Over! Final Score: ${this.score}`);
        location.reload();
    }

    onPoseDetected(poseName) {
        // 키보드 모드 무시
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isGameActive) return;

        // 1. 배경 스크롤
        this.bgX -= this.speed * 0.5;

        // 2. 플레이어 물리 처리
        if (this.player.state === "Jump") {
            this.player.y += this.player.jumpVelocity;
            this.player.jumpVelocity += this.player.gravity;

            if (this.player.y >= this.player.baseY) {
                this.player.y = this.player.baseY;
                this.player.jumpVelocity = 0;

                if (this.isDucking) {
                    this.player.state = "Duck";
                    this.player.height = 50;
                    this.player.y = this.player.baseY + 40;
                } else {
                    this.player.state = "Run";
                    this.player.height = 90;
                }
            }
        }

        // 3. 장애물 생성
        this.obstacleTimer++;
        if (this.obstacleTimer > 150 - (this.speed * 3)) {
            this.spawnObstacle(canvasWidth);
            this.obstacleTimer = 0;
        }

        // 4. 장애물 이동 및 충돌
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            let moveSpeed = this.speed + (obs.speedOffset || 0);
            obs.x -= moveSpeed;

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }

            // 충돌 체크 (판정 완화)
            const hitMargin = 15;
            if (
                obs.x + hitMargin < this.player.x + this.player.width - hitMargin &&
                obs.x + obs.width - hitMargin > this.player.x + hitMargin &&
                obs.y + hitMargin < this.player.y + this.player.height - hitMargin &&
                obs.y + obs.height - hitMargin > this.player.y + hitMargin
            ) {
                this.handleCollision();
                this.obstacles.splice(i, 1);
            }
        }
    }

    spawnObstacle(canvasWidth) {
        // 공중(Air) vs 지상(Ground) 확률
        const isAir = Math.random() < 0.35;

        let type, label, speedOffset, soundType;
        let yPos = 340;
        let height = 50; // 장애물 크기 확대 (기존 40 -> 50)

        // 희귀도(Rarity)
        const rarity = Math.random() * 100;

        if (isAir) {
            yPos = 180; height = 40; // 공중 위치 조정

            if (rarity < 5) {
                type = "Dragon"; label = "🐉"; speedOffset = 4; soundType = "roar";
            } else if (rarity < 20) {
                type = "Bat"; label = "🦇"; speedOffset = 3; soundType = "screech";
            } else if (rarity < 50) {
                type = "Eagle"; label = "🦅"; speedOffset = 3; soundType = "bird";
            } else {
                const birds = [
                    { l: "🦜", t: "Toucan" },
                    { l: "🐦", t: "BlueBird" },
                    { l: "🦟", t: "Mosquito" }
                ];
                const selected = birds[Math.floor(Math.random() * birds.length)];
                type = selected.t; label = selected.l; speedOffset = 2; soundType = "bird";
            }

        } else {
            yPos = 330; // 바닥 위치 조정 (크기가 커졌으므로 조금 위로)
            height = 50;

            if (rarity < 2) {
                type = "PinkDolphin"; label = "🐬"; speedOffset = 5; soundType = "whistle"; yPos = 310;
            } else if (rarity < 10) {
                type = "Capybara"; label = "🦦"; speedOffset = 1; soundType = "grunt";
            } else if (rarity < 20) {
                type = "GoldenFrog"; label = "🐸"; speedOffset = 0; soundType = "croak";
            } else if (rarity < 25) {
                type = "Meerkat"; label = "🐿️"; speedOffset = 2; soundType = "squeak"; // 미어캣 (다람쥐 이모지로 대체)
            } else if (rarity < 30) {
                type = "RedPanda"; label = "🦊"; speedOffset = 2; soundType = "squeak"; // 래서판다 (여우 이모지 대체)
            } else if (rarity < 32) {
                type = "Raccoon"; label = "🦝"; speedOffset = 2; soundType = "squeak"; // 라쿤
            } else if (rarity < 40) {
                type = "Badger"; label = "🦡"; speedOffset = 3; soundType = "growl"; // 오소리
            } else if (rarity < 50) { // 뱀 등
                type = "Snake"; label = "🐍"; speedOffset = 2; soundType = "hiss";
            } else if (rarity < 60) {
                type = "Jaguar"; label = "🐆"; speedOffset = 4; soundType = "roar";
            } else if (rarity < 70) {
                type = "Sloth"; label = "🦥"; speedOffset = -2; soundType = "sloth";
            } else {
                const commons = [
                    { l: "🪵", t: "Log", s: 0, snd: null },
                    { l: "🐊", t: "Croc", s: 0, snd: "croc" },
                    { l: "🐒", t: "Monkey", s: 2, snd: "monkey" },
                    { l: "🐗", t: "Boar", s: 1, snd: "grunt" },
                    { l: "🦎", t: "Lizard", s: 1, snd: "hiss" }
                ];
                const selected = commons[Math.floor(Math.random() * commons.length)];
                type = selected.t; label = selected.l; speedOffset = selected.s; soundType = selected.snd;
            }
        }

        this.obstacles.push({
            x: canvasWidth,
            y: yPos,
            width: 50, // 너비 확대
            height: height,
            type: type,
            label: label,
            speedOffset: speedOffset
        });

        if (soundType) this.playSound(soundType);
    }

    handleCollision() {
        this.lives--;
        this.playSound("hit");
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    playSound(type) {
        if (!this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        switch (type) {
            case "jump":
                osc.type = "sine";
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(500, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case "hit":
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case "bird":
            case "whistle":
                osc.type = "sine";
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.linearRampToValueAtTime(1500, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case "roar": // 퓨마, 드래곤
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case "monkey":
                osc.type = "square";
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.linearRampToValueAtTime(700, now + 0.1);
                osc.frequency.linearRampToValueAtTime(500, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case "croc":
            case "grunt": // 카피바라, 멧돼지
            case "sloth":
            case "growl": // 오소리
                osc.type = "triangle";
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case "hiss": // 뱀, 천산갑
            case "screech": // 박쥐
            case "squeak": // 라쿤, 래서판다
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    }

    draw(ctx) {
        if (!this.isGameActive) return;
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
            const scale = canvasHeight / this.bgImage.naturalHeight;
            const scaledWidth = this.bgImage.naturalWidth * scale;
            const scaledHeight = canvasHeight;
            const xPos = this.bgX % scaledWidth;

            ctx.drawImage(this.bgImage, xPos, 0, scaledWidth, scaledHeight);
            if (xPos + scaledWidth < canvasWidth) {
                ctx.drawImage(this.bgImage, xPos + scaledWidth, 0, scaledWidth, scaledHeight);
            }
            if (xPos + scaledWidth * 2 < canvasWidth) {
                ctx.drawImage(this.bgImage, xPos + scaledWidth * 2, 0, scaledWidth, scaledHeight);
            }
        } else {
            ctx.fillStyle = "#228B22";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        ctx.fillStyle = "rgba(101, 67, 33, 0.8)";
        ctx.fillRect(0, 380, canvasWidth, canvasHeight - 380);

        // 장애물 조금 더 크게 (45px)
        ctx.font = "45px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.obstacles.forEach(obs => {
            ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y + obs.height / 2);
        });

        // 플레이어도 크게 (60px)
        let playerEmoji = "🏃";
        if (this.player.state === "Jump") playerEmoji = "🪂";
        if (this.player.state === "Duck") playerEmoji = "🙇";

        ctx.font = "60px Arial";
        ctx.fillText(playerEmoji, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";

        function drawTextWithOutline(text, x, y) {
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        }

        const scoreStr = `Score: ${this.score}`;
        const lifeStr = `Lives: ${"❤️".repeat(this.lives)}`;

        drawTextWithOutline(scoreStr, 10, 30);
        drawTextWithOutline(lifeStr, 10, 60);
    }
}

window.JungleSurvivalGame = JungleSurvivalGame;
