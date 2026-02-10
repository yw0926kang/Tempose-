/**
 * gameEngine.js
 * 게임 매니저 (Game Manager)
 * 
 * 여러 게임 모드를 관리하고 전환하는 역할.
 * CatchFruitGame과 JungleSurvivalGame 중 하나를 선택하여 실행.
 */

class GameEngine {
  constructor() {
    this.currentGame = null;
    this.gameType = "none"; // "catchFruit", "jungle", "none"

    // 각 게임의 인스턴스 미리 생성
    this.games = {
      catchFruit: new CatchFruitGame(),
      jungle: new JungleSurvivalGame()
    };
  }

  /**
   * 특정 게임 선택 및 시작
   * @param {string} type - "catchFruit" 또는 "jungle"
   */
  selectGame(type) {
    // 기존 게임 중지
    if (this.currentGame && this.currentGame.stop) {
      this.currentGame.stop();
    }

    this.gameType = type;
    this.currentGame = this.games[type];

    if (this.currentGame) {
      console.log(`Game Selected: ${type}`);
      this.currentGame.start();
    } else {
      console.error(`Unknown game type: ${type}`);
    }
  }

  /**
   * 현재 게임 중지
   */
  stopGame() {
    if (this.currentGame && this.currentGame.stop) {
      this.currentGame.stop();
    }
    this.currentGame = null;
    this.gameType = "none";
  }

  /**
   * 델리게이트 패턴: 현재 활성화된 게임의 메서드 호출
   */
  onPoseDetected(poseName) {
    if (this.currentGame && this.currentGame.onPoseDetected) {
      this.currentGame.onPoseDetected(poseName);
    }
  }

  update(canvasWidth, canvasHeight) {
    if (this.currentGame && this.currentGame.update) {
      this.currentGame.update(canvasWidth, canvasHeight);
    }
  }

  draw(ctx) {
    // 게임이 선택되지 않았을 때 (메인 화면)
    if (!this.currentGame) {
      this.drawMainMenu(ctx);
      return;
    }

    // 선택된 게임 그리기
    if (this.currentGame && this.currentGame.draw) {
      this.currentGame.draw(ctx);
    }
  }

  /**
   * 메인 메뉴 화면 그리기
   */
  drawMainMenu(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // 배경 (어두운 반투명)
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    // 타이틀
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎮 Select A Game 🎮", width / 2, height / 3);

    // 안내 문구 (실제 버튼은 HTML로 구현 예정)
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("아래 버튼을 눌러 게임을 시작하세요!", width / 2, height / 2);
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;
