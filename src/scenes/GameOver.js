import Phaser from "../lib/phaser.js";

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("game-over");
  }
  preload() {
    this.load.image("background", "assets/bc.png");
  }
  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(1024, 1024, "background");

    this.add
      .text(width * 0.5, height * 0.5, "Game Over", {
        fontSize: 48,
        color: `#DF50E2`,
        background: `#94B5DC`,
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("game");
      this.sound.play("start");
    });
  }
}
