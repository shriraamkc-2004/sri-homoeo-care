import { test, expect } from "@playwright/test";

test.describe("Sri Homoeo Care smoke", () => {
  test("home responds and shows brand", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok() || res?.status() === 304).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    // Brand appears in EN or TA
    await expect(page.getByText(/Sri Homoeo|ஸ்ரீ|Homoeo Care/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("health endpoint is JSON", async ({ request }) => {
    const res = await request.get("/api/health");
    // 200 or 503 both prove the route is live
    expect([200, 503]).toContain(res.status());
    const json = await res.json();
    expect(json).toHaveProperty("service", "sri-homoeo-care");
    expect(json).toHaveProperty("engine");
  });
});
