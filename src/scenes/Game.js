import Phaser from "../lib/phaser.js";
import Flower from "../game/Flower.js";

export default class Game extends Phaser.Scene {
  flowersCollected = 0;
  score = 0;
  platformsAdded = 0;

  bestScore = 0;
  /** @type {Phaser.Physics.Arcade.Sprite} */
  player;

  /** @type {Phaser.Physics.Arcade.StaticGroup} */
  platforms;

  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  cursors;

  /** @type {Phaser.Physics.Arcade.Group} */
  flowers;

  /** @type {Phaser.GameObjects.Text} */
  flowersCollectedText;

  /** @type {Phaser.GameObjects.Text} */
  scoreText;

  /** @type {Phaser.GameObjects.Text} */
  bestScoreText;

  constructor() {
    super("game");
  }
  init() {
    this.flowersCollected = 0;
    this.platformsAdded = 0;
    this.bestScore = localStorage.getItem("bestScore") || 0;
  }
  //   ----------------------------------------------------------------------

  preload() {
    this.load.image("background", "assets/bc.png");

    this.load.image("platform", "assets/platform.png");

    this.load.image("player-down", "assets/player-down.png");

    this.load.image("player-up", "assets/player-up.png");

    this.cursors = this.input.keyboard.createCursorKeys();

    this.load.image("flower", "assets/iris.png");

    this.load.audio("jump", "assets/sfx/phaseJump4.ogg");

    this.load.audio("power", "assets/sfx/powerUp5.ogg");

    this.load.audio("down", "assets/sfx/spaceTrash5.ogg");

    this.load.audio("start", "assets/sfx/powerUp3.ogg");

    this.canvas = this.sys.game.canvas;
  }

  //   ----------------------------------------------------------------------

  create() {
    this.add.image(1024, 1024, "background").setScrollFactor(0, 0);
    let { width, height } = this.sys.game.canvas;

    this.flowers = this.physics.add.group({ classType: Flower });

    this.platforms = this.physics.add.staticGroup();
    for (let i = 0; i < 7; ++i) {
      const x = Phaser.Math.Between(300, this.sys.game.canvas.width - 300);
      const y = 100 * i;

      /** @type {Phaser.Physics.Arcade.Sprite} */
      const platform = this.platforms.create(x, y, "platform");
      platform.scale = 0.3;

      /** @type {Phaser.Physics.Arcade.StaticBody} */
      const body = platform.body;
      body.updateFromGameObject();

      const random = Phaser.Math.Between(0, 10);

      if (random >= 7) {
        this.addFlowerAbove(platform);
      }
    }

    this.player = this.physics.add
      .sprite(this.sys.game.canvas.width / 2, 320, "player-down")
      .setScale(0.5);

    this.physics.add.collider(this.platforms, this.flowers);
    this.physics.add.collider(this.platforms, this.player);

    this.physics.add.overlap(
      this.player,
      this.flowers,
      this.handleCollectFlower,
      undefined,
      this
    );

    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setDeadzone(this.scale.width * 1.5);

    const style = { color: "#DF50E2", fontSize: 24 };

    this.bestScoreText = this.add
      .text(150, 50, `Best Score: ${this.bestScore}`, style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);

    this.flowersCollectedText = this.add
      .text(150, 10, "Flowers: 0", style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);

    this.scoreText = this.add
      .text(150, 30, "Score: 0", style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);
  }

  //   ----------------------------------------------------------------------

  update() {
    const touchingDown = this.player.body.touching.down;

    if (touchingDown) {
      this.player.setVelocityY(-300);
      this.player.setTexture("player-up");
      this.score++;
      this.sound.play("jump");
      const value = `Score: ${this.score}`;
      this.scoreText.text = value;
    }

    const scrollY = this.cameras.main.scrollY;

    const vy = this.player.body.velocity.y;
    if (vy > 0 && this.player.texture.key !== "player-down") {
      this.player.setTexture("player-down");
    }

    this.platforms.children.iterate((child) => {
      /** @type {Phaser.Physics.Arcade.Sprite} */
      const platform = child;

      if (platform.y >= scrollY + 700) {
        platform.y = scrollY - Phaser.Math.Between(50, 80);

        platform.body.updateFromGameObject();

        const random = Phaser.Math.Between(0, 10);

        if (random >= 5) {
          this.addFlowerAbove(platform);
        }
      }
    });

    if (this.cursors.left.isDown && !touchingDown) {
      this.player.setVelocityX(-400);
    } else if (this.cursors.right.isDown && !touchingDown) {
      this.player.setVelocityX(400);
    } else {
      this.player.setVelocityX(0);
    }

    this.horizontalWrap(this.player);

    const bottomPlatform = this.findBottomMostPlatform();
    if (this.player.y > bottomPlatform.y + 200) {
      this.scene.start("game-over");

      this.sound.play("down");
      if (Number(localStorage.getItem("bestScore")) < this.score) {
        localStorage.setItem("bestScore", this.score);
        const value = `Best Score: ${this.score}`;
        this.scoreText.text = value;
      }
      this.score = 0;
    }
  }

  //   ----------------------------------------------------------------------

  /**
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5;
    const gameWidth = this.scale.width;

    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth;
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth;
    }
  }

  //   ---------------------------------------------------

  /**
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  addFlowerAbove(sprite) {
    const y = sprite.y - sprite.displayHeight;

    /** @type {Phaser.Physics.Arcade.Sprite} */
    const flower = this.flowers.get(sprite.x, y, "flower");

    flower.setActive(true);
    flower.setVisible(true);

    this.add.existing(flower);

    flower.body.setSize(flower.width, flower.height);

    this.physics.world.enable(flower);

    return flower;
  }

  //   ---------------------------------------------------

  /**
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {Flower} flower
   */
  handleCollectFlower(player, flower) {
    this.flowers.killAndHide(flower);
    this.physics.world.disableBody(flower.body);
    this.sound.play("power");

    this.flowersCollected++;

    const value = `Flowers: ${this.flowersCollected}`;
    this.flowersCollectedText.text = value;
  }

  //   ---------------------------------------------------

  findBottomMostPlatform() {
    const platforms = this.platforms.getChildren();
    let bottomPlatform = platforms[0];

    for (let i = 1; i < platforms.length; ++i) {
      const platform = platforms[i];

      if (platform.y < bottomPlatform.y) {
        continue;
      }
      bottomPlatform = platform;
    }
    return bottomPlatform;
  }
}
