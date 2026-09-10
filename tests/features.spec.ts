import { createAnimals, stepAnimal } from "../src/wildlife";
import { test, expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import { initialWorld } from "../src/simulation";
async function ready(page: Page) {
  await page.addInitScript(
    (w) => {
      localStorage.setItem("little-living-world-v1", JSON.stringify(w));
    },
    { ...initialWorld(), paused: true, reduced: true },
  );
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
}
async function spot(page: Page, x: number, y: number, z: number) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("No canvas");
  const camera = new PerspectiveCamera(
    (2 *
      Math.atan(
        Math.tan((45 * Math.PI) / 360) / Math.min(box.width / box.height, 1),
      ) *
      180) /
      Math.PI,
    box.width / box.height,
    0.1,
    1000,
  );
  camera.position.set(10, 8.5, 12);
  camera.lookAt(0, 0.1, 0);
  camera.updateMatrixWorld();
  const p = new Vector3(x, y, z).project(camera);
  return {
    x: box.x + ((p.x + 1) * box.width) / 2,
    y: box.y + ((1 - p.y) * box.height) / 2,
  };
}
async function tap(page: Page, x: number, y: number, z: number) {
  const p = await spot(page, x, y, z);
  await page.mouse.click(p.x, p.y);
}
test("cow milk, chicken eggs, fruit picking and dog reactions use actual scene clicks", async ({
  page,
}) => {
  await ready(page);
  await tap(page, 4.85, 0.8, 0);
  await expect(page.getByLabel("1 milk", { exact: true })).toBeVisible();
  await tap(page, 4.85, 0.8, 0);
  await expect(page.locator(".toast")).toContainText("More milk");
  const animals = createAnimals();
  for (const a of animals)
    stepAnimal(a, 0.1, initialWorld().plants, animals, false, true);
  const chicken = animals[2];
  await tap(page, chicken.x, 0.48, chicken.z);
  await expect(page.getByLabel("1 eggs", { exact: true })).toBeVisible();
  await tap(page, -3, 1.6, 0.5);
  await expect(page.getByLabel("2 fruit", { exact: true })).toBeVisible();
  await tap(page, -4.2, 0.65, 2.425);
  await expect(page.locator(".toast")).toContainText("Zoomies");
});
test("seasons wrap in sequence, sound is opt-in, and all animals have cloud beds at night", async ({
  page,
}) => {
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Enable animal sounds" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Enable animal sounds" }).click();
  await expect(
    page.getByRole("button", { name: "Mute animal sounds" }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const s of ["Summer", "Autumn", "Winter", "Spring"]) {
    await page.getByRole("button", { name: `Next season: ${s}` }).click();
    await expect(page.locator("main")).toHaveAttribute("data-season", s);
  }
  await page.getByRole("slider", { name: "Time of day" }).fill("22");
  await expect(page.getByText("z z z", { exact: true })).toHaveCount(14);
  await expect(page.getByText("Tiny shed · tap to knock")).toHaveCount(0);
  await page.screenshot({ path: "test-results/bedtime.png" });
});
test("free world starts empty, adds residents and lotus, and preserves the original garden", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Free world", exact: true }).click();
  await expect(page.locator(".island-label")).toContainText("0 PLANTS · 0");
  await page.getByRole("button", { name: "Animals", exact: true }).click();
  await page.getByLabel("Animal to add").selectOption("cow");
  await tap(page, -2, 0.262, 2);
  await expect(page.locator(".island-label")).toContainText("ANIMALS");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("little-living-world-free-v1") || "null",
          )?.animalSeeds.length,
      ),
    )
    .toBe(1);
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await page.getByRole("button", { name: "Lotus", exact: true }).click();
  await tap(page, 1.55, 0.262, 0.65);
  await expect(page.locator(".island-label")).toContainText("1 PLANTS");
  await page.getByRole("button", { name: "Return to garden" }).click();
  await expect(page.locator(".island-label")).toContainText("8 PLANTS");
  await page.getByRole("button", { name: "Free world", exact: true }).click();
  await expect(page.locator(".island-label")).toContainText("1 PLANTS");
});
test("mobile menus stay at the bottom and night labels remain readable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const open = page.getByRole("button", { name: "Open garden controls" });
  await expect(open).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Garden tools" }),
  ).toBeHidden();
  await page.screenshot({ path: "test-results/mobile-explore.png" });
  await open.click();
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await page.getByRole("slider", { name: "Time of day" }).fill("22");
  for (const name of [".species", ".time-panel"]) {
    const box = await page.locator(name).boundingBox();
    expect(box!.y).toBeGreaterThan(844 * 0.6);
    expect(box!.y + box!.height).toBeLessThan(800);
  }
  const contrast = await page
    .locator(".toolbar button[aria-pressed=true]")
    .evaluate((e) => {
      const css = getComputedStyle(e);
      const luminance = (str: string) => {
        const parts = str
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((x) => {
            const c = x / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
      };
      const a = luminance(css.color),
        b = luminance(css.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  expect(contrast).toBeGreaterThan(4.5);
  for (const [left, right] of [
    [".basket", ".top-actions"],
    ["#garden-settings", ".controls-toggle"],
  ]) {
    const a = await page.locator(left).boundingBox(),
      b = await page.locator(right).boundingBox();
    expect(Math.abs(a!.y + a!.height / 2 - b!.y - b!.height / 2)).toBeLessThan(
      2,
    );
    expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x);
  }
  await page.screenshot({ path: "test-results/mobile-night-controls.png" });
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await expect(open).toBeVisible();
  await expect(page.getByRole("slider", { name: "Time of day" })).toBeHidden();
  await page.screenshot({ path: "test-results/mobile-night-explore.png" });
  await open.click();
  await page
    .getByRole("button", { name: "Close garden controls" })
    .press("Escape");
  await expect(open).toBeFocused();
  await page.setViewportSize({ width: 320, height: 568 });
  await open.click();
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lotus", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Close garden controls" }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.screenshot({ path: "test-results/mobile-small-controls.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(open).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Garden tools" }),
  ).toBeVisible();
});

test("animal calls create audio only after sound is enabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__tones = 0;
    const original = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const osc = original.call(this),
        start = osc.start.bind(osc);
      osc.start = (when?: number) => {
        (window as any).__tones++;
        start(when);
      };
      return osc;
    };
  });
  await ready(page);
  await tap(page, 4.85, 0.8, 0);
  expect(await page.evaluate(() => (window as any).__tones)).toBe(0);
  await page.getByRole("button", { name: "Enable animal sounds" }).click();
  await tap(page, 4.85, 0.8, 0);
  await expect
    .poll(() => page.evaluate(() => (window as any).__tones))
    .toBeGreaterThan(0);
  for (const species of [
    "cow",
    "chicken",
    "goat",
    "sheep",
    "horse",
    "dog",
    "duck",
  ]) {
    const result = await page.evaluate(async (species) => {
      const context = new AudioContext();
      const response = await fetch(`/audio/${species}.wav`);
      const buffer = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      const samples = buffer.getChannelData(0);
      const peak = samples.reduce(
        (max, value) => Math.max(max, Math.abs(value)),
        0,
      );
      await context.close();
      return { duration: buffer.duration, peak };
    }, species);
    expect(result.duration).toBeGreaterThan(0.5);
    expect(result.duration).toBeLessThan(3.2);
    expect(result.peak).toBeGreaterThan(0.1);
    expect(result.peak).toBeLessThan(0.8);
  }
  await page.getByRole("button", { name: "Mute animal sounds" }).click();
  const before = await page.evaluate(() => (window as any).__tones);
  await tap(page, 4.85, 0.8, 0);
  expect(await page.evaluate(() => (window as any).__tones)).toBe(before);
});

test("thirsty plants recover after rain and keep their recovery on reload", async ({
  page,
}) => {
  const world = initialWorld();
  world.plants = world.plants.map((p) => ({ ...p, moisture: 0 }));
  world.paused = true;
  world.reduced = true;
  await page.addInitScript((w) => {
    if (!sessionStorage.getItem("care-fixture")) {
      localStorage.setItem("little-living-world-v1", JSON.stringify(w));
      sessionStorage.setItem("care-fixture", "true");
    }
  }, world);
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({ path: "test-results/plants-thirsty.png" });
  await page.getByRole("button", { name: "Rain", exact: true }).click();
  await tap(page, -2.5, 0.262, -0.8);
  await expect(page.locator(".toast")).toContainText("perk up");
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("little-living-world-v1")!)
              .plants[0].moisture,
        ),
      { timeout: 7000 },
    )
    .toBeGreaterThan(0.8);
  await page.screenshot({ path: "test-results/plants-recovered.png" });
  await page.reload();
  await expect(page.locator(".island-label")).toContainText("8 PLANTS");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("little-living-world-v1")!).plants[0]
          .moisture,
    ),
  ).toBeGreaterThan(0.8);
});

test("a rock surprises on its tenth Explore tap, then rests", async ({
  page,
}) => {
  test.setTimeout(30000);
  await ready(page);
  const surprise = page.getByText("A distinguished pebble.", { exact: true });
  // The east pond stone is accessible without another animal in front of it.
  const stone = await spot(page, 3.12, 0.39, 0.65);
  for (let i = 0; i < 9; i++) await page.mouse.click(stone.x, stone.y);
  await expect(surprise).toHaveCount(0);
  await page.mouse.click(stone.x, stone.y);
  await expect(surprise).toBeVisible();
  await page.screenshot({ path: "test-results/pebble-surprise.png" });
  await expect(surprise).toHaveCount(0, { timeout: 11000 });
  for (let i = 0; i < 10; i++) await page.mouse.click(stone.x, stone.y);
  await expect(surprise).toHaveCount(0);
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  for (let i = 0; i < 10; i++) await page.mouse.click(stone.x, stone.y);
  await expect(surprise).toHaveCount(0);
});
