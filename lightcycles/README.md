# Tron Light Cycles (1982)

A pure vanilla ES6 + HTML5 Canvas recreation of the classic 1982 cyber grid arena combat.

## Features
- **Zero Build Dependencies**: Native ES6 modules, HTML5 Canvas, Web Audio API synthesis.
- **Dynamic Synthesizer**: Continuous engine hum loops, Doppler turn bleeps, high-frequency turbo whine, and white-noise de-rez explosions.
- **Adaptive AI**: Flood-fill spatial analysis evaluating territory depth and preventing trap corridors.
- **Multi-Control Support**: Full keyboard mapping, on-screen responsive touch D-pad, swipe gestures, and gamepad support.
- **Cross-Platform**: Progressive Web App (PWA) with offline caching, Android APK, Debian/Linux desktop packaging, and terminal Python CLI.

## File Structure
- `index.html`: Retro arcade cabinet shell with responsive canvas.
- `style.css`: Cyberpunk neon aesthetic, glowing trails, CRT scanline effects.
- `manifest.json`: Offline PWA manifest.
- `sw.js`: Service worker asset cache.
- `src/engine.js`: Pure mathematical arena state and flood-fill AI simulation.
- `src/audio.js`: Web Audio oscillator and noise synthesis.
- `src/ui.js`: Input handling, animation loop, rendering, and HUD updates.
- `cli/lightcycles_cli.py`: Terminal simulation runner.
- `test/test_lightcycles.py`: Python unit tests.
- `RULES.md`: Manual and scoring mechanics.
