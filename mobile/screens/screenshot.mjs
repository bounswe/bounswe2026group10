import puppeteer from 'puppeteer';
import { readdirSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screensDir = resolve(__dirname, '../screenshots');
mkdirSync(screensDir, { recursive: true });

const SCREENS = [
  { file: '01-welcome-fixed.html',        label: '01-Welcome' },
  { file: '02-register-fixed.html',       label: '02-Register' },
  { file: '03-login-fixed.html',          label: '03-Login' },
  { file: '04-home-fixed.html',           label: '04-Home' },
  { file: '05-search-generic-fixed.html', label: '05-Search' },
  { file: '05-search-refined-fixed.html', label: '05-Search-Results' },
  { file: '06-dish-variety-fixed.html',   label: '06-Dish-Variety' },
  { file: '07-my-library-fixed.html',     label: '07-My-Library' },
  { file: '08-profile-fixed.html',        label: '08-Profile' },
  { file: '09-recipe-detail-fixed.html',  label: '09-Recipe-Detail' },
  { file: '10-comments-fixed.html',       label: '10-Comments' },
  { file: '11-cooking-mode-fixed.html',   label: '11-Cooking-Mode' },
  { file: '13-create-basic-fixed.html',   label: '13-Create-Basic' },
  { file: '14-create-ingred-fixed.html',  label: '14-Create-Ingredients' },
  { file: '15-create-steps-fixed.html',   label: '15-Create-Steps' },
  { file: '17-create-review-fixed.html',  label: '17-Create-Review' },
  { file: '18-settings-fixed.html',       label: '18-Settings' },
  { file: '19-other-profile-fixed.html',  label: '19-Other-Profile' },
  { file: '21-edit-profile-fixed.html',   label: '21-Edit-Profile' },
  { file: '23-messages-fixed.html',       label: '23-Messages' },
  { file: '24-chat-fixed.html',           label: '24-Chat' },
];

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

for (const s of SCREENS) {
  const filePath = `file://${resolve(__dirname, s.file)}`;
  // Pass 1 — load at 844px and measure where the real content ends
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const targetHeight = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) {
      const lastChild = [...main.children].at(-1);
      if (lastChild) return lastChild.offsetTop + lastChild.offsetHeight + 16 + 60;
      return main.scrollHeight + 60;
    }
    return document.body.scrollHeight;
  });

  // Pass 2 — reload at the exact target viewport so fixed header/nav land correctly
  await page.setViewport({ width: 390, height: targetHeight, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Strip body padding/min-height so nothing inflates beyond targetHeight
  await page.addStyleTag({ content: 'html, body { min-height: 0 !important; padding-bottom: 0 !important; }' });
  await new Promise(r => setTimeout(r, 100));

  const outPath = `${screensDir}/${s.label}.png`;
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`✓ ${s.label}`);
}

await browser.close();
console.log(`\nDone! Screenshots saved to: ${screensDir}`);
