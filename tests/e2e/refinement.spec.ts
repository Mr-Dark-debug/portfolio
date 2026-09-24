import { test, expect } from "@playwright/test";

test("unmatched URLs return a themed, non-indexable 404", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This page isn't here." }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("career rows and paired contact forms fit desktop and mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await expect(page.locator(".career-row")).toHaveCount(4);
  await expect(page.locator(".education-row")).toHaveCount(2);
  await page
    .locator("#experience")
    .screenshot({ path: "test-results/experience-desktop.png" });
  await page
    .locator("#selected-work")
    .screenshot({ path: "test-results/selected-work-desktop.png" });
  const left = await page.locator(".contact-column").boundingBox(),
    right = await page.locator(".onboarding-column").boundingBox();
  expect(left && right && right.x > left.x + left.width).toBeTruthy();
  expect(Math.abs(left!.y - right!.y)).toBeLessThan(2);
  await page
    .locator("#contact")
    .screenshot({ path: "test-results/contact-desktop.png" });
  await page.getByLabel("Full Name", { exact: true }).fill("Project enquiry");
  await page.getByLabel("Name", { exact: true }).fill("Quick hello");
  await expect(page.locator("#onboarding-name")).toHaveValue("Project enquiry");
  await expect(page.locator("#name")).toHaveValue("Quick hello");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("reader@example.com");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByLabel("What's your profession?", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("#contact")
    .screenshot({ path: "test-results/contact-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const mobileLeft = await page.locator(".contact-column").boundingBox(),
    mobileRight = await page.locator(".onboarding-column").boundingBox();
  expect(mobileRight!.y).toBeGreaterThan(mobileLeft!.y + mobileLeft!.height);
});

test("project overview generates on each visit, keeps facts, and retries a failure", async ({
  page,
}) => {
  let calls = 0;
  let overviewPhase: "success" | "failure" = "success";
  await page.route("**/api/projects/overview**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: {
          hasRepository: true,
          snapshot: {
            name: "PocketLLM/PocketLLM",
            url: "https://github.com/PocketLLM/PocketLLM",
            stars: 67,
            forks: 11,
            openIssues: 0,
            branch: "main",
            license: "MIT",
            pushedAt: "2026-09-19T12:00:00Z",
            languages: [{ name: "Python", percent: 100 }],
            commits: [
              {
                sha: "abcdef1",
                message: "A source-backed commit",
                date: "2026-09-19T12:00:00Z",
                url: "https://github.com/PocketLLM/PocketLLM/commit/abcdef1",
              },
            ],
            unavailable: [],
          },
        },
      });
    calls++;
    if (overviewPhase === "failure")
      return route.fulfill({
        status: 503,
        json: { error: "The overview could not be generated." },
      });
    return route.fulfill({
      json: {
        overview: "### What it does\nAn overview from supplied evidence.",
        generatedAt: new Date().toISOString(),
      },
    });
  });
  await page.goto("/en/projects/pocketllm");
  await expect(
    page.getByRole("heading", { name: "What it does" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A source-backed commit" }),
  ).toHaveAttribute("href", /github.com/);
  await page.screenshot({
    path: "test-results/project-desktop.png",
    fullPage: true,
  });
  overviewPhase = "failure";
  await page.reload();
  await expect(
    page.getByText("The overview could not be generated."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A source-backed commit" }),
  ).toBeVisible();
  overviewPhase = "success";
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "What it does" }),
  ).toBeVisible();
  expect(calls).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
