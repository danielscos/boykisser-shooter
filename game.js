import kaboom from "kaboom";
import playerUrl from "./player.png";
import bulletUrl from "./bullet.png";

// kaboom init
kaboom({
  width: 2000,
  height: 1000,
  background: [10, 10, 40],
  scale: 1,
});

// player ship
loadSprite("player", playerUrl);

// enemy ship
loadSprite(
  "enemy",
  "data:image/svg+xml;base64," +
    btoa(`
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,20 4,4 12,8 20,4" fill="#ff0000"/>
    </svg>
  `),
);

loadSprite("bullet", bulletUrl);

let score = 0;
let lives = 3;
const PLAYER_SPEED = 300;
const BULLET_SPEED = 600;

// start scene
scene("start", () => {
  add([
    text("BOYKISSER SHOOTER", { size: 48 }),
    pos(center().x, center().y - 100),
    anchor("center"),

    color(255, 255, 255),
  ]);

  add([
    text("Use ARROW KEYS to move", { size: 24 }),
    pos(center().x, center().y + 60),
    anchor("center"),
    color(200, 200, 200),
  ]);

  add([
    text("SPACE to shoot", { size: 24 }),
    pos(center().x, center().y + 20),
    anchor("center"),
    color(200, 200, 200),
  ]);

  add([
    text("Press ENTER to start", { size: 24 }),
    pos(center().x, center().y + 100),
    anchor("center"),
    color(200, 200, 200),
  ]);

  onKeyPress("enter", () => go("game"));
});

// game scene
scene("game", () => {
  score = 0;
  lives = 3;

  for (let i = 0; i < 50; i++) {
    add([
      rect(2, 2),
      pos(rand(0, width()), rand(0, height())),
      color(255, 255, 255),
      opacity(rand(0.3), 1),
      move(DOWN, rand(20, 50)),
      offscreen({ destroy: true, ditance: 10 }),
      {
        update() {
          if (this.pos.y > height()) {
            this.pos.y = 0;
            this.pos.x = rand(0, width());
          }
        },
      },
    ]);
  }

  // add player
  const player = add([
    sprite("player"),
    pos(width() / 2, height() - 80),
    anchor("center"),
    area(),
    scale(2),
    "player",
  ]);

  const SPEED = 300;

  onKeyDown("left", () => {
    if (player.pos.x > 16) {
      player.move(-SPEED, 0);
    }
  });

  onKeyDown("right", () => {
    if (player.pos.x < width() - 16) {
      player.move(SPEED, 0);
    }
  });

  onKeyDown("up", () => {
    if (player.pos.y > 16) {
      player.move(0, -SPEED);
    }
  });

  onKeyDown("down", () => {
    if (player.pos.y < height() - 16) {
      player.move(0, SPEED);
    }
  });

  // shooting with rate limiting
  let canShoot = true;
  const shootCooldown = 0.15;

  // shooting
  onKeyDown("space", () => {
    console.log("Space key pressed, canShoot:", canShoot);
    if (canShoot) {
      console.log("Creating bullet at position:", player.pos.x, player.pos.y);
      const bullet = add([
        sprite("bullet"),
        pos(player.pos.x, player.pos.y - 40),
        anchor("center"),
        area(),
        move(UP, BULLET_SPEED),
        offscreen({ destroy: true }),
        "bullet",
      ]);
      console.log("Bullet created:", bullet);

      canShoot = false;
      wait(shootCooldown, () => {
        canShoot = true;
      });
    }
  });

  // spawn enemies
  const ENEMY_SPEED = 120;

  let spawnInterval = 2;

  loop(2, () => {
    spawnInterval = Math.max(0.5, 2 - score / 100);

    if (chance(1 / spawnInterval)) {
      const randomX = rand(20, width() - 20);
      add([
        sprite("enemy"),
        pos(randomX, 0),
        anchor("center"),
        area(),
        move(DOWN, ENEMY_SPEED + score / 10),
        offscreen({ destroy: true }),
        "enemy",
      ]);
    }
  });

  let combo = 0;
  let comboTimer = 0;

  onCollideUpdate("bullet", "enemy", (bullet, enemy) => {
    for (let i = 0; i < 8; i++) {
      add([
        rect(4, 4),
        pos(enemy.pos),
        color(255, rand(100, 200), 0),
        move(rand(0, 360), rand(100, 200)),
        lifespan(0.5),
      ]);
    }

    bullet.destroy();
    enemy.destroy();

    combo += 1;
    comboTimer = 2;
    score += 10 * combo;

    add([
      text("x" + combo, { size: 32 }),
      pos(enemy.pos),
      color(255, 255, 0),
      move(UP, 50),
      lifespan(1),
    ]);
  });

  onUpdate(() => {
    if (comboTimer > 0) {
      comboTimer -= dt();
      if (comboTimer <= 0) combo = 0; // reset
    }
  });

  onCollideUpdate("enemy", "player", (enemy, player) => {
    shake(10);
    enemy.destroy();

    lives -= 1;

    player.color = rgb(255, 100, 100);
    wait(0.1, () => {
      player.color = rgb(255, 255, 255);
    });

    if (lives <= 0) go("gameover");
  });

  loop(10, () => {
    if (chance(0.3)) {
      add([
        rect(20, 20),
        pos(rand(50, width() - 50), 0),
        color(0, 255, 0),
        anchor("center"),
        area(),
        move(DOWN, 100),
        offscreen({ destroy: true }),
        "powerup",
      ]);
    }
  });

  onCollideUpdate("player", "powerup", (player, powerup) => {
    powerup.destroy();
    lives += 1;
  });

  // ui
  const scoreText = add([
    text("Score: " + score, { size: 24 }),
    pos(20, 20),
    color(255, 255, 255),
    fixed(),
  ]);

  const livesText = add([
    text("Lives: " + lives, { size: 24 }),
    pos(20, 50),
    color(255, 255, 255),
    fixed(),
  ]);

  onUpdate(() => {
    scoreText.text = "Score: " + score;
    livesText.text = "Lives: " + lives;
  });

  //debugging
  add([
    text("use arrow keys to move, SPACE to shoot", { size: 24 }),
    pos(center().x, 50),
    anchor("center"),
    color(150, 150, 150),
  ]);
});

scene("gameover", () => {
  add([
    text("GAME OVER", { size: 64 }),
    pos(center()),
    anchor("center"),
    color(255, 100, 100),
  ]);

  add([
    text("Final score: " + score, { size: 32 }),
    pos(center().x, center().y + 80),
    anchor("center"),
    color(255, 255, 255),
  ]);

  add([
    text("Press ENTER to restart", { size: 24 }),
    pos(center().x, center().y + 140),
    anchor("center"),
    color(200, 200, 200),
  ]);

  onKeyPress("enter", () => go("start"));
});

go("start");
