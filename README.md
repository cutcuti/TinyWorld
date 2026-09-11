# Little Living World

A small floating garden full of plants, farm animals, seasons, and wonderfully improbable bedtime arrangements.

[Play the live world](https://tinyworld-drab.vercel.app)

TypeScript, React, Vite, React Three Fiber, Drei, and procedural Three.js geometry. No backend, API key, account or paid asset is required. Animal recordings are bundled with the app. Optional Google Fonts fall back to system fonts.

## Run locally

Node.js 22.12+ is required; Node.js 24 LTS is recommended.

```sh
npm ci
npm run dev
npm run build       # TypeScript check and production bundle
npm run preview     # Serve dist/
npm test            # Simulation, migration, wildlife and bedtime checks
npm run test:e2e    # Real browser interaction tests; requires installed Chrome
```

Browser tests use Chrome. To use bundled Chromium, run `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts`.

## Explore and collect

Drag to orbit; scroll or pinch to zoom. The circular arrow resets the camera. In **Explore**, click or tap:

- **Cows:** collect milk, with a 20-second refill.
- **Chickens:** collect eggs, with a 12-second refill.
- **Fruit trees:** pick ripe fruit. Mature trees hold up to three fruits. Fruit regrows about every 15 seconds, faster in autumn, and stops growing during winter.
- **Dogs:** trigger ten seconds of playful chasing. Chickens, cows, goats and sheep scatter, ducks paddle faster, and the horse stays calm. Chasing stays bounded within the island.
- **Other animals:** say hello and hear their call when sound is enabled.

The harvest basket saves locally. **Sound** is off on each page load; enable it to hear short animal recordings on clicks and occasional quieter calls during the day. Calls use a gentle pitch lift, small variations and softened volume. Muting stops current calls; background tabs are quiet. Sources and CC0 license details are in [audio credits](public/audio/CREDITS.md).

The **wind button** enables a separate ambient soundscape: a soft breeze, looping recorded water, and occasional blackbird phrases between 06:00 and 19:00. It starts off, fades in and out, and pauses while the tab is hidden. Animal sounds can remain muted. Recordings load only when enabled.

The garden has three chickens, two cows, two goats, two sheep, one horse, two dogs and two ducks. Lotus flowers and water lilies decorate the pond.

## Gardening and seasons

**Plant** offers Trees, Flowers, Lilies, and Lotus. Click open grass for land plants or the pond for lotus. Water, edges and occupied spots reject unsuitable planting. **Rain** waters nearby plants and brings a brief rainbow after the shower ends. A white unicorn with a lavender mane and golden horn walks across its top, then disappears with it. Less motion keeps the unicorn at the crest. Plants reach maturity in roughly 83 seconds; watering accelerates growth for eight seconds within 1.35 world units. Mature flower patches attract butterflies.

The season button advances only in order: **Spring → Summer → Autumn → Winter → Spring**. Blossom colors and fresh grass give way to summer greens, autumn foliage and fallen leaves, then snowy trees, ground and falling snow. The pond remains open for ducks. Season choice is saved.

Spring also brings six pastel Easter eggs and two little rabbit visitors to the original garden. Rabbits take gentle hops with pauses to sniff, and retreat at bedtime; Less motion keeps them still. They leave when the season changes. Free world stays bare for you to build.

Winter brings a small scarf-wearing reindeer, a snow-capped Christmas tree, warm evening lights, and two wrapped presents to the original garden. The reindeer visits during daylight and wanders gently; Less motion holds it still. These seasonal decorations do not populate Free world.

Autumn brings two bushy-tailed squirrels and a few scattered acorns to the original garden. They take short strolls, pause to nibble, and retreat at bedtime. Less motion keeps them still; Free world remains yours to populate.

The time slider controls daylight. Pause holds the clock while plants and creature behavior continue. A full day lasts roughly six minutes.

## Cloud bedrooms

At 19:00 clouds descend to the island’s edge while animals stretch. Animals walk to their clouds and board one at a time, then ride up to bed. Every species sleeps on a cloud; there is no shed.

Clouds carry animals back to the edge in the morning, then they walk home. Chickens start waking at 05:42; the rest follow at 06:18. Moving the clock back to daytime wakes the animals too. **Less motion** skips stretches, boarding and cloud rides, stops wandering and particle travel, and moves animals directly between resting states.

## Free world

**Free world** opens a separate, initially bare island with no plants or animals. Plant your own garden, then use **Animals** to choose and place neighbors. Ducks need the pond; other animals need grass.

**Return to garden** switches back to the original garden. Each mode keeps its own save. **Start fresh** asks for confirmation and resets only the current mode. Free worlds allow up to 20 animals; both modes allow up to 85 plants.

## Interface and persistence

On phones the plant submenu, time slider, seasons, sound and tools stay together in a bottom dock. Night controls use opaque dark surfaces and bright text; active buttons use pale surfaces and dark labels. Buttons, toggles, selectors, and the slider support keyboard navigation. Spatial planting and animal interactions use mouse or touch.

The camera button exports the rendered canvas as a PNG without the interface. WebGL2 is required, with an explanatory fallback if unavailable. Pixel density is capped at 1.6 and particle populations are bounded; animal geometry and materials are shared.

Plants, soil moisture, harvests, cooldowns, seasons, settings, and free-world resident placements save every 1.5 seconds and when leaving the page. Existing garden saves migrate automatically. Saves remain on the same browser and origin, with no cloud sync or offline growth. Clearing browser storage removes them. Animal wandering positions and bedtime animation progress restart on reload; the free-world placement layout is preserved.

## Code map

- `src/App.tsx`: controls, actions, save scheduling and separate world modes.
- `src/Scene.tsx`: island, trees, camera and picking.
- `src/Animals.tsx`: animal models, interaction and sleeping visuals.
- `src/wildlife.ts`: bounded roaming, obstacle avoidance and chasing.
- `src/rest.ts`: stretching, cloud beds and staggered waking.
- `src/simulation.ts`: growth, seasons, harvesting and placement rules.
- `src/persistence.ts`: validation and migration of saved worlds.
- `src/GardenDetails.tsx`: lilies, lotus, seasonal particles and rainbows.
- `src/audio.ts`: opt-in sampled animal sounds.

## Deployment and verification

Vercel deploys the GitHub `main` branch using the included Vite configuration. Build command: `npm run build`; output: `dist`. No environment variables are needed. Build output, local settings, browser-test artifacts and secrets are excluded from Git.

Tests cover growth, collections and cooldowns, seasons, save migration, free-world placement, animal boundaries, chasing and horse immunity, bedtime and cloud beds, browser clicks, audio opt-in, keyboard controls, camera gestures, reset, screenshot export, and mobile control placement and active-button contrast. Testing uses desktop Chrome and mobile emulation; physical devices and Safari remain unverified.

The Three.js runtime makes the initial bundle larger than a typical static page. Creature behavior is intentionally simple. There is no feeding, breeding, multiplayer, terrain sculpting or cross-device save.

On mobile, every mode uses a compact bottom dock showing the active tool and selection. Tap **Controls** for tools, seasons, time and settings; **Hide controls** keeps the current tool active. Choosing a plant, animal type or Rain collapses the menu so the island stays clear. The headline remains visible above the island.

Land plants begin to look thirsty after about four minutes without water and gradually droop and soften in colour. Rain perks them up over a few seconds. They never die, disappear, lose growth or stop producing fruit. Pond lotuses stay hydrated naturally. Moisture saves locally, old saves start hydrated, and time away does not cause catch-up wilting.

Ten mature, healthy plants invite occasional tiny visitors. Birds land on tree crowns during the day; snails cross leaves beside plants. Small groups of fireflies visit from dusk through the night. Snails and fireflies rest in winter. Visits last about 22–28 seconds, with randomized quiet gaps; Less motion keeps visitors still. These guests do not consume resources or block clicks, and visit timing restarts on reload.

A small secret: tap the same rock ten times in Explore to meet a distinguished pebble. It wears a top hat for eight seconds, then rests for twenty seconds before taps count again. Less motion keeps it still. Rock surprises do not change your saved garden.
