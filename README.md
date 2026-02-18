# Boykisser Shooter 🐾

A galaxy shooter game, but it's a boykisser. Dodge and blast waves of enemies across 6 increasingly hectic rounds.

**[▶ Play it here](https://danielscos.github.io/boykisser-shooter/)**

---

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| Space | Shoot |
| Enter | Start / confirm |

---

## Gameplay

- You have **3 lives** — getting hit by an enemy or a collision costs one life
- Defeat all enemies in a wave to advance to the next one
- Kill enemies in quick succession to build a **combo multiplier**
- 6 waves total, looping endlessly once completed — each wave gets faster and more crowded

### Enemy Types

| Type | Description |
|------|-------------|
| **Regular** | Standard enemies that fly straight down |
| **Fast** | Lighter enemies that move 1.5× faster |
| **Heavy** | Tankier enemies with more HP and slower movement |
| **Popcorn** | Swarms that fly in from the sides in sinusoidal patterns, diving and weaving across the screen |

---

## Tech Stack

- **[KAPLAY](https://kaplay.dev/)** — game framework (Kaboom.js successor)
- **TypeScript**
- **Vite**
- **GitHub Pages** for deployment

---

## Running Locally

```sh
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Building & Deploying

```sh
# build only
npm run build

# build + deploy to GitHub Pages
npm run deploy
```

---

*Started as a small project for Campfire Flagship — my first step into game development before moving on to Godot. :3*