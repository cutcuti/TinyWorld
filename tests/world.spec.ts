import { test, expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
const key = "little-living-world-v1";
async function ground(page: Page, x: number, z: number) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("Missing canvas");
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
  const p = new Vector3(x, 0.262, z).project(camera);
  return {
    x: box.x + ((p.x + 1) / 2) * box.width,
    y: box.y + ((1 - p.y) / 2) * box.height,
  };
}
async function read(page: Page) {
  return page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || "null"),
    key,
  );
}
test("plant, water, save/reload, day/night, screenshot and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Pause day-night cycle" }).click();
  await page.getByLabel("Less motion").check();
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  const point = await ground(page, -2.5, 2.7);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(".island-label")).toContainText("9 PLANTS");
  await expect.poll(async () => (await read(page))?.plants.length).toBe(9);
  const dry = (await read(page)).plants.at(-1);
  await page.getByRole("button", { name: "Rain", exact: true }).click();
  await page.mouse.click(point.x, point.y);
  await expect
    .poll(async () => (await read(page))?.plants.at(-1).water)
    .toBeGreaterThan(0);
  const wet = (await read(page)).plants.at(-1);
  expect(wet.growth).toBeGreaterThan(dry.growth);
  await page.reload();
  await expect(page.locator(".island-label")).toContainText("9 PLANTS");
  await expect(
    page.getByRole("button", { name: "Resume day-night cycle" }),
  ).toBeVisible();
  await expect(page.getByLabel("Less motion")).toBeChecked();
  await page.getByRole("slider", { name: "Time of day" }).fill("22");
  await expect(page.locator("main")).toHaveClass("night");
  await page.screenshot({
    path: "test-results/night.png",
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save screenshot" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("little-living-world.png");
  await download.saveAs("test-results/export.png");
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep my garden" }).click();
  await expect(page.locator(".island-label")).toContainText("9 PLANTS");
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await page
    .locator("dialog")
    .getByRole("button", { name: "Start fresh", exact: true })
    .click();
  await expect(page.locator(".island-label")).toContainText("8 PLANTS");
  expect(errors).toEqual([]);
});
test("dragging never plants, water is blocked, camera rotates, zooms and resets", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  const pond = await ground(page, 1.55, 0.65);
  await page.mouse.click(pond.x, pond.y);
  await expect(page.locator(".island-label")).toContainText("8 PLANTS");
  const point = await ground(page, -2.5, 2.7);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 80, point.y + 25, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".island-label")).toContainText("8 PLANTS");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  const before = await page.locator("canvas").screenshot();
  await page.mouse.move(700, 500);
  await page.mouse.down();
  await page.mouse.move(850, 500, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await page.locator("canvas").screenshot();
  expect(after.equals(before)).toBe(false);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(400);
  const zoomed = await page.locator("canvas").screenshot();
  expect(zoomed.equals(after)).toBe(false);
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.getByRole("button", { name: "Plant", exact: true }).click();
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(".island-label")).toContainText("9 PLANTS");
});
test("narrow touch viewport keeps tools accessible and plants flowers", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Open garden controls" }).tap();
  await page.getByRole("button", { name: "Plant", exact: true }).tap();
  await page.getByRole("button", { name: "Flowers", exact: true }).tap();
  const point = await ground(page, -2.5, 2.7);
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator(".island-label")).toContainText("9 PLANTS");
  await expect(page.locator("main")).toHaveAttribute("data-tool", "plant");
  await expect(page.getByRole("slider", { name: "Time of day" })).toBeHidden();
  await expect(page.locator(".controls-toggle")).toContainText(
    "Plant · Flowers",
  );
  await expect(page.locator(".world-caption")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-plant-collapsed.png" });
  await page.getByRole("button", { name: "Open garden controls" }).tap();
  await page.getByRole("button", { name: "Rain", exact: true }).tap();
  await expect(page.locator("main")).toHaveAttribute("data-tool", "rain");
  await expect(page.locator(".bottom-ui")).toBeHidden();
  await page.touchscreen.tap(point.x, point.y);
  await expect
    .poll(async () => (await read(page))?.plants.at(-1).water)
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Open garden controls" }).tap();
  await page.getByRole("button", { name: "Free world", exact: true }).tap();
  await page.getByRole("button", { name: "Animals", exact: true }).tap();
  await page.getByRole("button", { name: "Close garden controls" }).tap();
  await expect(page.locator("main")).toHaveAttribute("data-tool", "animal");
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator(".island-label")).toContainText(/1\s*ANIMALS/);
  await page.getByRole("button", { name: "Open garden controls" }).tap();
  await expect(page.getByRole("slider", { name: "Time of day" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile.png",
  });
  await context.close();
});

test("keyboard controls and unavailable-WebGL fallback", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  const slider = page.getByRole("slider", { name: "Time of day" });
  await page.getByRole("button", { name: "Pause day-night cycle" }).click();
  await slider.fill("12");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("12.01");
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  const context = await browser.newContext();
  const unsupported = await context.newPage();
  await unsupported.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args as any);
    } as typeof original;
  });
  await unsupported.goto("http://127.0.0.1:5173");
  await expect(
    unsupported.getByText("This world couldn’t start"),
  ).toBeVisible();
  await context.close();
});
