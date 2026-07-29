import { chromium } from "playwright";

const OUT = "/private/tmp/claude-502/-Users-bertrand-coizy-git-perso-prohimuf/a864b394-18d0-441c-8ce2-185c08432f8c/scratchpad";
const BOOK = "http://localhost:4180/prohimuf/spikes/r3f-flyers/book.html";
const WALL = "http://localhost:4180/prohimuf/spikes/r3f-flyers/wall.html";

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox"],
});

async function shoot(url, name, extra) {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => { errs.push(e.message); });
  await page.goto(url, { waitUntil: "networkidle" });
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  if (extra) await extra(page, name);
  console.log(`${name}: ${errs.length ? errs.join(" | ") : "no errors"}`);
  await page.close();
}

await shoot(BOOK, "probe-book");
// Turn a page and capture mid-flight, to prove the leaf actually swings.
await shoot(BOOK, "probe-book-turn", async (page, name) => {
  await page.getByRole("button", { name: "page suivante" }).click();
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: `${OUT}/${name}-mid.png` });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${OUT}/${name}-end.png` });
});
// Regression check: the wall version must still work untouched.
await shoot(WALL, "probe-wall-still-ok");

await browser.close();
