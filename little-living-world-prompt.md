# Little Living World — build prompt

Build a beautiful, interactive browser experience called **Little Living World**: a tiny floating island that the player brings to life through planting, rain, and changing daylight. The project should be fun to explore, visually impressive in a short demo, and ready to share as a public GitHub repository.

## Creative direction

Use a cozy, stylized 3D storybook aesthetic: a sculpted floating island, soft rounded trees, warm sunlight, pastel skies, sparkling water, and subtle atmospheric particles. At night, introduce glowing mushrooms and fireflies. Aim for a cohesive, carefully composed scene with depth, pleasing lighting, and gentle motion. The world should occupy almost the whole screen. Keep controls small and elegant; avoid a dashboard layout.

Choose a tasteful palette and make the initial island beautiful before the user interacts. Use procedural geometry and materials wherever practical so the experience does not depend on paid assets or external services.

## First playable version

- Rotate and zoom around one floating island, with sensible camera limits and a reset-view control.
- Provide a compact toolbar with Explore, Plant, and Rain tools. Clearly show the active tool.
- In Plant mode, clicking suitable ground plants a small tree or patch of flowers with a smooth growth animation. Prevent planting on water, steep slopes, or occupied spots.
- In Rain mode, clicking or holding over an area creates a small rain cloud that waters nearby plants. Show a subtle radius preview before applying rain.
- Make watering visibly accelerate growth. Mature flowers attract a few butterflies during the day. At night, fireflies appear. Keep these relationships simple, legible, and bounded.
- Add a smooth day–night cycle with a time-of-day slider and an option to pause it.
- Save the planted world and settings locally and restore them on reload. Include a reset-world control with confirmation.
- Include a screenshot button that exports the scene without the toolbar.

Focus on these interactions before adding more features. Creatures with complex AI, seasons, terrain sculpting, accounts, and multiplayer are future possibilities, not first-version requirements.

## Feel and usability

Make planting and watering feel satisfying through animation, gentle particles, and clear visual feedback. Avoid excessive bloom, clutter, or constant distracting movement. Provide a brief first-use hint, then let the scene speak for itself. Support mouse and touch, prevent camera gestures from accidentally planting, and make controls keyboard-accessible. Respect reduced-motion preferences and provide a visible fallback if WebGL is unavailable. Sound is optional and must be off by default.

## Implementation

If the repository already has a suitable stack, use it. Otherwise, use TypeScript, React, Vite, and React Three Fiber with Drei. No backend, API keys, or paid services should be required. Separate scene rendering, interaction tools, simulation state, and persistence. Use frame-rate-independent updates, limit plant and particle counts, and use instancing where it meaningfully improves performance. Handle resizing and high pixel-density screens without excessive GPU load.

## Delivery and verification

Implement the working experience, not just a mockup or a plan. Prioritize a polished end-to-end version over a large unfinished feature list. Run the production build and relevant checks. Verify planting, watering, camera controls, day–night transitions, save-and-reload, reset, and screenshot export. Test a narrow viewport and report any verification you could not perform.

Include a clear README with setup and build commands, controls, a concise explanation of the simulation, and a short roadmap for future additions. Keep generated build files and secrets out of version control. Prepare the repository for sharing, but do not publish, push, or deploy it without a separate request. Finish with a concise summary of what works, how to run it, and any remaining limitations.
