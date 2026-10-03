# Scrambly Playable Ad – Simula Take-Home

A polished, mobile-friendly web playable built for **Scrambly**, designed to connect casual gameplay, progression, and rewards into a short, engaging experience. 

Built with **Phaser 4** and **TypeScript**, packaged via Webpack.

---

## 🛠️ Tools & Credits
* **Engine & Build Tools:** Phaser 4.0.0, TypeScript 5.4.5, Webpack 5.99.6
* **Testing & Debugging:** Google Chrome DevTools (responsive emulation), Safari macOS, and Xcode Simulator.
* **AI Coding Assistant:** Gemini Flash-Lite (leveraged for rapid code scaffolding, boilerplate setup, and structuring game logic loops).
* **Developer:** Tomás Bruckner

---

## 💡 Development Process & Contributions

* **Role & Contributions:** Acting as Technical Architect and Director, I designed the project structure and guided development block by block using iterative prompts, verifying functionality, code readability, and keeping the AI aligned. I also functioned as Game Designer (defining game flow, mechanics, and branding) and QA/Tester, executing the full development cycle within a strict 4-hour time-box.
* **Why Phaser Was Chosen:** Phaser was specifically selected for its robust, built-in architecture capable of handling crucial playable ad requirements out of the box—such as automatic tab visibility change handling (`changevisibility` / pause state management) and unified input handling for both touch and mouse clicks via standardized pointer events.
* **Lightweight Bundle Decision (< 5 MB):** To keep the bundle well under the 5 MB limit, ensure a lightning-fast first load, and maintain stable performance, I chose to utilize procedural Phaser graphics rather than loading external heavy images that could impact initial load times or FPS.
* **UI Polish Trade-off:** While improvements to the base game UI were explored, limitations in time and the AI tool during final adjustments led to keeping selected emojis for certain UI elements. This deliberate choice avoided introducing layout or state bugs during the final retouch phase.

---

## 📱 Browser & Device Testing Notes

* **Tested Environments:**
  * **Google Chrome (Desktop & DevTools):** Used for primary code development, rapid debugging, console monitoring, and responsive layout mode emulation across various mobile aspect ratios.
  * **Safari (macOS):** Used for desktop browser compatibility and layout checks on Apple's WebKit engine.
  * **Xcode Simulator (iOS Mobile Safari):** Used for native mobile testing and verification of touch interactions on simulated hardware, specifically testing **iPhone 17 Pro Max** (large form factor / tall portrait viewports) and **iPhone SE (2nd generation)** (compact form factor / smaller screen constraints).
* **Known Limitations / Untested Behavior:** 
  * Testing was limited to browser emulation and iOS Simulator environments due to the rapid 4-hour time constraint. Physical Android hardware testing was not performed directly, though standard touch events and responsive container scaling handle standard viewports smoothly.
  * **iOS Safari UI Quirk:** On iOS Safari, the browser's dynamic bottom address/navigation bar can hide or auto-collapse depending on scrolling or touch gestures, which occasionally causes the bottom UI elements or time bar to not be persistently visible at all times until the view adjusts.

---

## Versions

This project uses:
- [Phaser 4.0.0](https://github.com/phaserjs/phaser)
- [Webpack 5.99.6](https://github.com/webpack/webpack)
- [TypeScript 5.4.5](https://github.com/microsoft/TypeScript)

---

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch a local development web server |
| `npm run build` | Create a production build in the `dist` folder |

## Running Locally

1. Clone or extract the project repository.
2. Open a terminal in the project root and run `npm install`.
3. Start the local development server by running `npm run dev`.
4. Open your browser and navigate to `http://localhost:8080`.

---

## Technical & Handoff Notes

* **ZIP Structure:** The production build is compiled directly into the `dist` folder, with `index.html` positioned correctly at the root for submission.
* **Size Constraint:** Fully optimized to stay well under the **5 MB** production limit.
* **Runtime Independence:** Runs completely offline from a static HTTP server with no external requests, database calls, logins, or API keys required during runtime.
* **Mobile & Touch Support:** Fully responsive for both touch and mouse interactions, optimized for mobile screen dimensions (tested on portrait viewports like 320×568 and 390×844). Page scrolling is disabled to prevent interference with gameplay.
* **Visibility API:** Automatically pauses game timers and loops when the browser tab is hidden, resuming seamlessly upon focus without time skips.
* **CTA Integration:** Clicking the final Call to Action button triggers a local confirmation message (*“CTA clicked — demo only”*), logs the event to the console, and safely remains in-app without redirecting.
* **Review-Friendly Restart:** Fully cleans up game states, input listeners, and timers on reset to prevent memory leaks or duplicate triggers.

---

## Template Project Structure

| Path                         | Description                                                |
|------------------------------|------------------------------------------------------------|
| `dist/`                      | Production-ready build output (`index.html` at root).      |
| `public/assets`              | Game sprites, audio, etc. Served directly at runtime.      |
| `src/main.ts`                | Application bootstrap.                                     |
| `src/game/`                  | Core game logic, scenes, and mechanics.                    |

---

## Deploying to Production

After running `npm run build`, the entire bundled output will be saved inside the `dist` folder. To host or test the production version, serve the contents of `dist` via any static file server (e.g., `npx serve dist`).

---

## Join the Phaser Community!

**Visit:** The [Phaser website](https://phaser.io)<br />
**Code:** 2000+ [Examples](https://labs.phaser.io)<br />
**Discord:** Join us on [Discord](https://discord.gg/phaser)<br />

Created by [Phaser Studio](mailto:support@phaser.io). Adapted for the Simula Playable Take-Home.
