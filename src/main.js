import Phaser from "./lib/phaser.js";
import Game from "./scenes/Game.js";
import GameOver from "./scenes/GameOver.js";

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: `100%`,
  height: `100%`,
  scene: [Game, GameOver],
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 200,
      },
      debug: false,
    },
  },
});
