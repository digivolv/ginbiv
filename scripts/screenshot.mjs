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
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });

  await page.goto('http://localhost:4173/');
  await page.waitForSelector('[data-testid="navigation"]', { timeout: 12000 });
  await page.waitForTimeout(2000);

  for (const dest of destinations) {
    await page.click(`button[data-destination="${dest}"]`);
    await page.waitForTimeout(2200);
    const path = `/tmp/ss-${vp.name}-${dest}.png`;
    await page.screenshot({ path });
    console.log(`Captured: ${path}`);
  }
  await context.close();
}

await browser.close();
console.log('Done');
