# theburntpeanut games

A separate static gallery for Pacnut, Paper Peanut and Bungerman in the AriaKawa dark/yellow visual style. Cards show Pacnut's maze, Paper Peanut's chapter book and Bungerman's full arcade cabinet.

Only the three browser game builds and showcase assets are included. Paper Peanut and Bungerman originate from AriaKawa/AriaKawa.github.io at commit 60c4b706e33fc4ab86a6a74e9d66ccbbb81ee38d. Pacnut is the local pac-nut/dist build. The shelf UI and thumbnails follow the original site at commit 42566388460acab73d00cf788653579d065b8ef4. The original website remains independent.

Serve this directory with any static HTTP server. GitHub Pages serves the root of the main branch. No build step is required.

Bungerman's view toolbar offers fullscreen (with an in-page fallback) and 60–140% game zoom via dial, wheel, keyboard, plus/minus and reset. The gallery has quiet synthesized button sounds with a saved mute preference. Pacnut's synthesized rifle report follows actual shots and its existing game sound toggle. No external audio assets or dependencies are used.

Bungerman solo play runs in the browser. Its optional online rooms retain the original game's public Firebase client configuration and depend on that existing service. No new service or credentials are provisioned.

Unofficial fan games; no streamer endorsement is implied.

Each game has a themed top-left Back control. Subpages return to the game's menu; the menu returns to the gallery. Paper Peanut dialogs have their own Back control in the browser's modal layer. Bungerman's view controls follow the playfield at the top right and scale with it. Leaving a room or cancelling a connection returns immediately, with network cleanup in the background.
