import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const destinations = ['INDEX', 'WORK', 'ABOUT', 'CONTACT'];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto('http://localhost:4173/');
  await page.waitForSelector('[data-testid="navigation"]', { timeout: 12000 });
  await page.waitForTimeout(2500); // full reveal animation

  for (const dest of destinations) {
    await page.click(`button[data-destination="${dest}"]`);
    await page.waitForTimeout(2000); // full transition
    await page.screenshot({ path: `/tmp/audit-${vp.name}-${dest}.png` });
    console.log(`Captured: /tmp/audit-${vp.name}-${dest}.png`);
  }

  if (consoleErrors.length || pageErrors.length) {
    console.log(`ERRORS at ${vp.name}:`, [...consoleErrors, ...pageErrors]);
  } else {
    console.log(`No console/page errors at ${vp.name}`);
  }

  await context.close();
}

await browser.close();
