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
    <svg width="24" height="24" xmlns="https://www.w3.org/2000/svg">
      <polygon points="12,20 4,4 12,8 20,4" fill="#ff0000"/>
    </svg>
  `),
);

// bullet - we'll create bullets using rect() in the game scene
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

go("start");
