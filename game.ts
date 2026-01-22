import kaplay from "kaplay";
import playerSheetUrl from "./playerSheet.png";
import bulletUrl from "./bullet.png";
import enemiesSheetUrl from "./enemiesSheet.png";

// kaplay init
kaplay({
  width: 1500,
  height: 1000,
  background: [10, 10, 40],
  scale: 1,
});

// player ship
loadSprite("player", playerSheetUrl, {
  sliceX: 4,
  sliceY: 1,
  anims: {
    fly: { from: 0, to: 3, loop: true, speed: 10 },
  },
});

// enemy ship
loadSprite("enemies", enemiesSheetUrl, {
  sliceX: 10,
  sliceY: 1,
});

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
  // ---------------- constants ----------------

  score = 0;
  lives = 3;
  let combo = 0;
  let comboTimer = 0;
  let currentWave = 0;
  let waveActive = false;
  let enemiesRemaining = 0;
  let enemiesInWave = 0;

  const ENEMY_SPEED = 120;
  const POPCORN_SPEED = 150;
  const POPCORN_AMPLITUDE = 100;
  const POPCORN_FREQUENCY = 3;

  // ------------ waves -------------

  const waves = [
    // wave 1: tutorial wave, display game mechanics and popcorn enemies
    { regular: 0, fast: 0, heavy: 0, popcornWaves: 2, spawnDelay: 1.5 },

    // wave 2: introduce regular enemies
    { regular: 5, fast: 0, heavy: 0, popcornWaves: 1, spawnDelay: 1.5 },

    // wave 3; mix it up
    { regular: 8, fast: 2, heavy: 0, popcornWaves: 2, spawnDelay: 1.2 },

    // rest
    { regular: 10, fast: 3, heavy: 1, popcornWaves: 2, spawnDelay: 1.0 },
    { regular: 12, fast: 5, heavy: 2, popcornWaves: 3, spawnDelay: 0.8 },
    { regular: 15, fast: 8, heavy: 3, popcornWaves: 4, spawnDelay: 0.6 },
  ];

  for (let i = 0; i < 50; i++) {
    const star = add([
      rect(2, 2),
      pos(rand(0, width()), rand(0, height())),
      color(255, 255, 255),
      opacity(rand(0.3, 1)),
      move(DOWN, rand(20, 50)),
      offscreen({ destroy: true, distance: 10 }),
    ]);

    star.onUpdate(() => {
      if (star.pos.y > height()) {
        star.pos.y = 0;
        star.pos.x = rand(0, width());
      }
    });
  }

  // add player
  const player = add([
    sprite("player", { anim: "fly" }),
    pos(width() / 2, height() - 80),
    anchor("center"),
    area(),
    scale(3),
    "player",
  ]);

  const SPEED = 350;

  onKeyDown("left", () => {
    player.move(-SPEED, 0);
  });

  onKeyDown("right", () => {
    player.move(SPEED, 0);
  });

  onKeyDown("up", () => {
    player.move(0, -SPEED);
  });

  onKeyDown("down", () => {
    player.move(0, SPEED);
  });

  player.onUpdate(() => {
    const halfWidth = (player.width * player.scale.x) / 2;
    const halfHeight = (player.height * player.scale.y) / 2;

    player.pos.x = Math.max(
      halfWidth,
      Math.min(player.pos.x, width() - halfWidth),
    );
    player.pos.y = Math.max(
      halfHeight,
      Math.min(player.pos.y, height() - halfHeight),
    );
  });

  // shooting with rate limiting
  let canShoot = true;
  const shootCooldown = 0.15;

  // shooting
  onKeyDown("space", () => {
    if (canShoot) {
      const bullet = add([
        sprite("bullet"),
        pos(player.pos.x, player.pos.y - 40),
        anchor("center"),
        area(),
        move(UP, BULLET_SPEED),
        offscreen({ destroy: true }),
        "bullet",
      ]);

      canShoot = false;
      wait(shootCooldown, () => {
        canShoot = true;
      });
    }
  });

  // --------------------- spawn functions ---------------------------

  function spawnEnemy(
    frame: number,
    points: number,
    scaleMultiplier: number,
    speed: number,
  ): void {
    const enemyBaseWidth = 24;
    const totalScale = 3 * scaleMultiplier;
    const enemyHalfWidth = (enemyBaseWidth * totalScale) / 2;
    const margin = enemyHalfWidth + 100;
    const randomX = rand(margin, width() - margin);

    const enemy = add([
      sprite("enemies", { frame: frame }),
      pos(randomX, 0),
      anchor("center"),
      area(),
      scale(3 * scaleMultiplier),
      move(DOWN, speed),
      offscreen({ destroy: true }),
      opacity(1),
      "enemy",
      { points: points, hp: 3 },
    ]);

    enemy.onDestroy(() => {
      enemiesRemaining--;
      checkWaveComplete();
    });
  }

  function spawnPopcornWave(waveSize: number) {
    const spawnFromLeft = chance(0.5);
    const popcornHalfWidth = (24 * 2) / 2;
    const safeMargin = popcornHalfWidth + POPCORN_AMPLITUDE + 20;
    const startX = spawnFromLeft ? safeMargin : width() - safeMargin;
    const direction = spawnFromLeft ? 1 : -1;

    const moveSpeed = currentWave === 0 ? POPCORN_SPEED * 0.7 : POPCORN_SPEED;

    for (let i = 0; i < waveSize; i++) {
      wait(i * 0.3, () => {
        const popcorn = add([
          sprite("enemies", { frame: 3 }),
          pos(startX, -20 - i * 40),
          anchor("center"),
          area(),
          scale(2),
          offscreen({ destroy: true }),
          opacity(1),
          "enemy",
          "popcorn",
          {
            hp: 1,
            points: 5,
            startX: startX,
            direction: direction,
            timeAlive: 0,
          },
        ]);

        // ----------- popcorn creation -----------

        popcorn.onUpdate(() => {
          popcorn.timeAlive += dt();
          popcorn.pos.y += moveSpeed * dt();

          const sineOffset =
            Math.sin(popcorn.timeAlive * POPCORN_FREQUENCY) * POPCORN_AMPLITUDE;
          const newX = popcorn.startX + sineOffset * popcorn.direction;
          popcorn.pos.x = Math.max(
            popcornHalfWidth,
            Math.min(newX, width() - popcornHalfWidth),
          );
        });

        popcorn.onDestroy(() => {
          enemiesRemaining--;
          checkWaveComplete();
        });
      });
    }
  }

  function startWave(waveNumber: number): void {
    if (waveNumber >= waves.length) {
      currentWave = 0;
      waveNumber = 0;
    }

    const wave = waves[waveNumber];
    waveActive = true;

    enemiesInWave = wave.regular + wave.fast + wave.heavy;
    enemiesRemaining = enemiesInWave;

    for (let i = 0; i < wave.regular; i++) {
      wait(i * wave.spawnDelay, () => {
        const randomFrame = Math.floor(rand(4, 7));
        spawnEnemy(randomFrame, 10, 1, ENEMY_SPEED);
      });
    }

    for (let i = 0; i < wave.fast; i++) {
      wait((wave.regular + i) * wave.spawnDelay, () => {
        const fastFrame = Math.floor(rand(0, 3));
        spawnEnemy(fastFrame, 15, 1, ENEMY_SPEED * 1.5);
      });
    }

    for (let i = 0; i < wave.heavy; i++) {
      wait((wave.regular + wave.fast + i) * wave.spawnDelay, () => {
        const heavyFrame = Math.floor(rand(7, 10));
        spawnEnemy(heavyFrame, 20, 1.5, ENEMY_SPEED * 0.7);
      });
    }

    for (let i = 0; i < wave.popcornWaves; i++) {
      const waveSize = currentWave === 0 ? 6 : 4;
      enemiesInWave += waveSize;
      enemiesRemaining += waveSize;

      const popcornDelay = currentWave === 0 ? i * 5 : i * 4;
      wait(popcornDelay, () => {
        spawnPopcornWave(waveSize);
      });
    }
  }

  function checkWaveComplete() {
    if (waveActive && enemiesRemaining <= 0) {
      waveActive = false;

      wait(3, () => {
        currentWave++;
        startWave(currentWave);
      });
    }
  }

  // --------------------- collision handlers ------------------------

  onCollideUpdate("bullet", "enemy", (bullet, enemy) => {
    for (let i = 0; i < 8; i++) {
      add([
        rect(4, 4),
        pos(enemy.pos),
        color(255, rand(100, 200), 0),
        move(rand(0, 360), rand(100, 200)),
        opacity(1),
        lifespan(0.5, { fade: 0.3 }),
      ]);
    }

    bullet.destroy();

    // ----------------- enemy collision handler --------------

    if (enemy.hp !== undefined) {
      enemy.hp -= 1;
      if (enemy.hp > 0) {
        enemy.color = rgb(255, 100, 100);
        wait(0.1, () => {
          enemy.color = rgb(255, 255, 255);
        });
        return;
      }
    }

    enemy.color = rgb(255, 100, 100);

    wait(0.1, () => {
      add([
        sprite("enemies", { frame: enemy.frame }),
        pos(enemy.pos),
        anchor("center"),
        scale(enemy.scale),
        opacity(0.85),
        lifespan(0.2, { fade: 0.1 }),
        z(enemy.z || 0),
      ]);

      enemy.destroy();
    });

    combo += 1;
    comboTimer = 2;

    const pointsEarned = (enemy.points || 10) * combo;
    score += pointsEarned;

    add([
      text("x" + combo, { size: 32 }),
      pos(enemy.pos),
      color(255, 255, 0),
      move(UP, 50),
      opacity(1),
      lifespan(1, { fade: 0.3 }),
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
    for (let i = 0; i < 12; i++) {
      add([
        rect(6, 6),
        pos(powerup.pos),
        color(0, 255, rand(100, 200)),
        move(rand(0, 360), rand(150, 250)),
        opacity(1),
        lifespan(0.6, { fade: 0.3 }),
      ]);
    }

    powerup.destroy();
    lives += 1;
    shake(8);

    player.color = rgb(100, 255, 100);
    wait(0.15, () => {
      player.color = rgb(255, 255, 255);
    });
  });

  // --------------------- UI --------------------

  const scoreText = add([
    text("Score: " + score, { size: 24 }),
    pos(20, 20),
    color(255, 255, 255),
    z(100),
  ]);

  const livesText = add([
    text("Lives: " + lives, { size: 24 }),
    pos(20, 50),
    color(255, 255, 255),
    z(100),
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

  wait(1, () => startWave(0));
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
