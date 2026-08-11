# 🏹 Vocabullseye

**Aim, shoot, and learn! An interactive archery-based vocabulary quiz that turns mastering new words into a physics-driven mini-game.**

Vocabullseye is a highly responsive, mobile-friendly HTML5 Canvas game designed to help users memorize vocabulary words through engaging mechanics. Instead of clicking standard multiple-choice buttons, players draw a bow, aim at the correct stickman, and fire!

## ✨ Features

- **Physics-Based Archery:** Realistic bow-draw and arrow trajectory physics, complete with an aiming arc preview.
- **Dynamic Vocabulary Pool:** Loads questions from a local JSON dataset, randomizing the correct answer and distractor options for every playthrough.
- **Interactive Lifelines:** Use the "50/50" button to eliminate two incorrect options, or the "Hint" button to view clever mnemonics for the current word.
- **Mobile First & Fully Responsive:** Fluidly scales to any screen size. Features optimized hitboxes, dynamic layout compression, and touch-drag mechanics specifically tailored for mobile screens.
- **Beautiful UI:** A modern, glassy mint-and-teal aesthetic with smooth CSS micro-animations.

## 🎮 How to Play

1. Read the definition at the top of the screen (e.g., *"What word means: The state of having conflicting emotional attitudes?"*).
2. Look at the vocabulary words hovering above the target stickmen.
3. Touch/click anywhere on the screen and drag left to pull back the bowstring. 
4. Adjust your vertical aim, then release to shoot the arrow.
5. Hitting the correct stickman grants you **+100 points** and increases your streak. Missing or hitting the wrong stickman costs you **-10 points**.

## 🛠️ Tech Stack

- **HTML5 Canvas:** For rendering the archer, stickmen, bow mechanics, and arrow flight.
- **Vanilla JavaScript:** Zero dependencies. Handles the game loop (`requestAnimationFrame`), physics calculations, and DOM manipulation.
- **CSS3:** Modern flexbox layouts, CSS variables, backdrop-filters (glassmorphism), and keyframe animations for the HUD and overlays.

## 🚀 Local Development

Since the game fetches question data from a local JSON file (`data.json`), it needs to be run over a local web server (to avoid CORS errors).

1. Clone the repository.
2. Open the directory in your terminal.
3. Start a local server. For example, using Python:
   ```bash
   python3 -m http.server 3000
   ```
   Or using Node/NPM:
   ```bash
   npx serve .
   ```
4. Open `http://localhost:3000` in your browser to play!
