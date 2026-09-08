# Little Living World

A peaceful, interactive 3D floating garden. Plant a tree, bring a little rain, and watch your island move from morning light to glowing mushrooms and fireflies at night.

Built with TypeScript, React, Vite, React Three Fiber, Drei, and procedural Three.js geometry. No backend, account, API key, or paid asset is required. Optional Google Fonts fall back to system fonts if unavailable.

## Run locally

Use Node.js 22.12+ (Node.js 24 LTS recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

```sh
npm run build       # TypeScript check and production bundle in dist/
npm run preview     # Serve the production bundle
npm test            # Simulation and save validation tests
npm run test:e2e    # Browser interaction tests; requires Google Chrome
```

Browser tests use the installed Chrome channel. To use Playwright's bundled Chromium instead, run `npx playwright install chromium` and remove `channel: 'chrome'` in `playwright.config.ts`.

## Controls

- **Explore:** drag with a mouse or one finger to orbit. Scroll or pinch to zoom. The top-right circular arrow restores the camera.
- **Plant:** choose Trees or Flowers, then click or tap open grass. Water, island edges, and occupied spots reject planting. Drags and multi-touch gestures do not plant.
- **Rain:** click or tap to create a short rain shower. A ring previews the watering radius on pointer hover; touch shows it when interacting.
- **Time:** drag the time slider through a full day; pause freezes the clock while plants continue growing.
- **Camera:** downloads a PNG of the 3D scene with no interface overlay.
- **Less motion:** stops tree sway, butterfly flight, and particle travel. Defaults to the device's reduced-motion preference.
- **Start fresh:** opens a confirmation before replacing the garden with its original plants.

Buttons, toggles, and the time slider support keyboard navigation with Tab, Enter/Space, and slider arrow keys. Spatial gardening and camera orbit use a pointer or touch.

## Simulation and saving

Plants grow from seedlings to maturity in about 83 seconds. Rain affects plants within 1.35 world units, accelerating growth for eight seconds. Mature flowers attract up to six butterflies by day. Night brings seven glowing mushrooms and 28 fireflies. The world is capped at 85 plants, and rain uses one bounded, instanced particle system. Pixel density is capped at 1.6.

The clock takes about six minutes for a full cycle. Time steps are independent of frame rate and capped after a background-tab delay. There is no offline growth. The island has a flat, plantable plateau; its rocky sides and edge are not plantable.

Plants, time, pause, and motion settings save to browser local storage every 1.5 seconds and when the page is left. Saves are validated before use; malformed data restores the original garden. Saves stay on the same browser and origin. Clearing browser storage removes them; private browsing or blocked storage may prevent saving, and the interface shows that state.

## Animal neighbors

The island is 25% wider than the original, with about 56% more surface area. Ten procedural animals live in the garden: three chickens, two cows, two goats, two sheep, and one horse. They wander, pause to graze, avoid the pond, trees, one another and the island edge, and rest at night. Hover an animal in Explore mode to see its species.

Less motion stops their movement. Animals are a fixed ambient population; their positions restart on reload, while existing plant saves remain compatible. This version does not add feeding, breeding, or animal placement controls.

## Project structure

- `src/Animals.tsx`: species models, gait and grazing animation.
- `src/wildlife.ts`: bounded animal movement and obstacle avoidance.
- `src/Scene.tsx`: procedural terrain, plants, lighting, wildlife, rain, camera and ground picking.
- `src/App.tsx`: toolbar, actions, simulation clock, confirmations and screenshot download.
- `src/simulation.ts`: pure placement, growth and watering rules.
- `src/persistence.ts`: versioned local save validation and recovery.
- `src/style.css`: responsive overlay and day/night interface.
- `src/simulation.test.ts`, `tests/world.spec.ts`: unit and browser checks.

## Deploy on Vercel

Import this GitHub repository into Vercel. Use the Vite framework preset, `npm run build`, and output directory `dist`. The included `vercel.json` supplies these settings. No environment variables are needed. GitHub integration can deploy subsequent pushes automatically.

Alternatively, from a signed-in Vercel CLI, run `vercel --prod`. Only publish when you intend the site to be public. Build output, local settings and secrets are excluded from Git.

## Verification and limitations

Automated checks cover placement restrictions, bounded growth and watering, save validation, browser planting/watering, reload persistence, day/night controls, camera gestures and reset, screenshot download, reset confirmation, and a 390px touch viewport. Browser testing uses desktop Chrome with mobile emulation; physical iOS/Android devices and Safari are not verified. A WebGL-capable browser is required; an explanatory fallback is provided when WebGL cannot start.

The Three.js runtime makes the initial JavaScript bundle larger than a typical static page. Terrain is a single plateau, wildlife behavior is deliberately simple, and there is no shared or cross-device save.

## Small roadmap

- More plant shapes and richer terrain details.
- Optional ambient sound, off by default.
- Seasonal color palettes and gentle creature behaviors.
- Export/import for portable worlds.

Accounts, multiplayer, and terrain sculpting are outside this first version.
