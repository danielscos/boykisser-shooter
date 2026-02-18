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
const PLAYER_SPEED = 500;
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
    { regular: 0, fast: 0, heavy: 0, popcornWaves: 1, spawnDelay: 1.5 },

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

  onKeyDown("left", () => {
    player.move(-PLAYER_SPEED, 0);
  });

  onKeyDown("right", () => {
    player.move(PLAYER_SPEED, 0);
  });

  onKeyDown("up", () => {
    player.move(0, -PLAYER_SPEED);
  });

  onKeyDown("down", () => {
    player.move(0, PLAYER_SPEED);
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
      timer(),
      "enemy",
      { points: points, hp: 3 },
    ]);

    wait(rand(0.5, 2.0), () => {
      // loop every 2 to 4 seconds
      enemy.loop(rand(2.0, 4.0), () => {
        // only shoot if the ene,y is actuall on screen
        if (enemy.pos.y > 50 && enemy.pos.y < height() - 50) {
          add([
            rect(6, 12),
            pos(enemy.pos.x, enemy.pos.y + 30),
            anchor("center"),
            color(255, 50, 50), // red
            area(), // enable collision
            move(DOWN, 400), // move down fast
            offscreen({ destroy: true }), // cleanup when off screen
            "enemyBullet", // tag for collision handling
          ]);
        }
      });
    });

    enemy.onDestroy(() => {
      enemiesRemaining--;
      checkWaveComplete();
    });
  }

  function spawnPopcornWave(
    waveSize: number,
    spawnFromLeft: boolean,
    waveIndex: number,
  ) {
    const popcornHalfWidth = (24 * 2) / 2;
    const safeMargin = popcornHalfWidth + POPCORN_AMPLITUDE + 20;

    const moveSpeed = waveIndex === 0 ? POPCORN_SPEED * 1.5 : POPCORN_SPEED;

    // For Wave 0, we perform the "Cross-Over Pincer" which spawns PAIRS (Left & Right)
    // So we iterate waveSize times, but spawn 2 enemies if currentWave == 0.
    // If not wave 0, we use original logic.
    const loopCount = waveSize;

    for (let i = 0; i < loopCount; i++) {
      wait(i * 0.4, () => {
        // Wave 0 spawns pairs. Other waves spawn single side.
        const sides =
          waveIndex === 0
            ? ["left", "right"]
            : [spawnFromLeft ? "left" : "right"];

        sides.forEach((side) => {
          const isLeft = side === "left";
          let startX = 0;
          let direction = isLeft ? 1 : -1;

          if (waveIndex === 0) {
            startX = isLeft ? width() * 0.1 : width() * 0.9;
          } else {
            startX = isLeft ? safeMargin : width() - safeMargin;
          }

          // Store these in closure variables to ensure they are available to update loop
          const initialX = startX;
          const initialDir = direction;

          const popcorn = add([
            sprite("enemies", { frame: 3 }),
            pos(startX, waveIndex === 0 ? -50 : -20 - i * 30),
            anchor("center"),
            area(),
            scale(2),
            // Increase offscreen distance buffer so they don't die immediately on spawn
            offscreen({ destroy: true, distance: 400 }),
            opacity(1),
            "enemy",
            "popcorn",
            {
              hp: 1, // health points
              points: 5, // how many points im worth
              startX: startX, // start position
              direction: direction, // direction`
              timeAlive: 0,
              phase: "dive", // start in 'dive' state
              controlX: 0,
              controlY: 0,
              targetX: 0, // flying to what x?
              targetY: 0, // flying to what y?
              baseY: 0, // center Y position
              phaseTimer: 0, // how long have i been doing the current movement?
              diveVelocity: vec2(0, 0), // speed and direction vector
              spawnIndex: i, // my ID number to decide if i am odd or even
              originSide: isLeft ? "left" : "right",
              waveIndex: waveIndex, // Remember which wave created me!
            },
          ]);

          if (waveIndex === 0) {
            // CONFIGURATION
            const spacing = 50;
            const gap = 60;

            // logic:
            // if im from the left group, my target is to the left of the screen
            // we substract (gap + spacing) to move further left for each subsequent enemy
            if (isLeft) {
              popcorn.targetX = width() / 2 - gap - i * spacing;
            } else {
              popcorn.targetX = width() / 2 + gap + i * spacing;
            }

            popcorn.targetY = height() * 0.4; // everyone targets same height (40% down the screen)

            // calculate the vector (direction and speed) to get there
            const targetPos = vec2(popcorn.targetX, popcorn.targetY);
            const startPos = vec2(startX, -50);

            // .sub() gets the difference vector
            // .unit() normalizes it to length 1 (just direction)
            // .scale() multiplies it by speed
            popcorn.diveVelocity = targetPos
              .sub(startPos)
              .unit()
              .scale(moveSpeed);
          }

          popcorn.onUpdate(() => {
            popcorn.timeAlive += dt();

            // Use local waveIndex instead of global currentWave
            if (popcorn.waveIndex === 0) {
              if (popcorn.phase === "dive") {
                const targetPos = vec2(popcorn.targetX, popcorn.targetY);
                const distToTarget = popcorn.pos.dist(targetPos);

                // are we close enough? (within 10 pixels)
                if (distToTarget < 10) {
                  popcorn.pos = targetPos; // snap exactly to target position
                  popcorn.baseY = popcorn.pos.y;
                  popcorn.phase = "oscillate";
                  popcorn.phaseTimer = 0;
                } else {
                  // keep flying
                  popcorn.pos = popcorn.pos.add(
                    popcorn.diveVelocity.scale(dt()),
                  );
                }
              } else if (popcorn.phase === "oscillate") {
                popcorn.phaseTimer += dt(); // count up time

                const frequency = 4; // how fast we bob up and down
                const amplitude = 60; // how far we move (pixels)

                // if spawnIndex is even, remainder is 0 -> dir becomes -1
                // if spawnIndex is odd, remainder is 1 -> dir becomes 1
                const dir = popcorn.spawnIndex % 2 === 0 ? -1 : 1;

                // set Y position based on time
                // sin() gives a value between -1 and 1
                // we multiply by amplitude to make it bigger
                // we multiply it by dir to flip the direction
                popcorn.pos.y =
                  popcorn.baseY +
                  Math.sin(popcorn.phaseTimer * frequency) * amplitude * dir;

                // after 4 seconds, get bored and leave
                if (popcorn.phaseTimer > 4.0) {
                  popcorn.phase = "exit";
                }
              } else if (popcorn.phase === "exit") {
                // if i came from the left, i go back left (-1)
                // if i came from the right, i go back right (1)
                const exitDir = popcorn.originSide === "left" ? -1 : 1;

                // move horizontally fast (2x speed)
                popcorn.pos.x += exitDir * moveSpeed * 2 * dt();
              }
            } else {
              // later waves: original sine wave pattern
              popcorn.pos.y += moveSpeed * dt();

              const sineOffset =
                Math.sin(popcorn.timeAlive * POPCORN_FREQUENCY) *
                POPCORN_AMPLITUDE;
              // Use closure variable initialX to be absolutely safe
              const newX = initialX + sineOffset * initialDir;
              popcorn.pos.x = Math.max(
                popcornHalfWidth,
                Math.min(newX, width() - popcornHalfWidth),
              );
            }
          });

          popcorn.onDestroy(() => {
            enemiesRemaining--;
            checkWaveComplete();
          });
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

    // Determine random start side for the first popcorn wave
    const startLeft = chance(0.5);

    for (let i = 0; i < wave.popcornWaves; i++) {
      // CONFIGURATION
      // if wave 0: spawn 8 pairs (16 enemies)
      // if wave 1: spawn 6 enemies
      const waveSize = currentWave === 0 ? 8 : 6;

      // For Wave 0, we spawn pairs so we count total enemies correctly
      // waveSize is number of spawns. Pairs = 2x.
      const totalEnemies = currentWave === 0 ? waveSize * 2 : waveSize;

      enemiesInWave += totalEnemies;
      enemiesRemaining += totalEnemies;

      const popcornDelay = currentWave === 0 ? i * 5 : i * 4;
      wait(popcornDelay, () => {
        // Alternate sides: even indices use startLeft, odd use opposite
        const isLeft = i % 2 === 0 ? startLeft : !startLeft;
        spawnPopcornWave(waveSize, isLeft, currentWave);
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

  function hurtPlayer() {
    shake(10); // screen shake
    lives -= 1;

    // flash the player red
    const player = get("player")[0];
    if (player) {
      player.color = rgb(255, 100, 100);
      wait(0.1, () => {
        player.color = rgb(255, 255, 255);
      });
    }

    if (lives <= 0) go("gameover");
  }

  onCollideUpdate("bullet", "enemy", (bullet, enemy) => {
    // Prevent multiple hits on the same dying enemy
    if (enemy.isDying) {
      bullet.destroy();
      return;
    }

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

    bullet.destroy(); // Destroy the bullet immediately

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

    // Mark enemy as dying so it doesn't give score again
    enemy.isDying = true;
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

  onCollide("enemyBullet", "player", (bullet, player) => {
    bullet.destroy();
    hurtPlayer();
  });

  onCollideUpdate("enemy", "player", (enemy, player) => {
    enemy.destroy();
    hurtPlayer();
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
