// Accessibility scan of the running app with axe-core in a real browser (Playwright).
// jsdom tests can't check contrast or layout; this can. Run it against `npm run dev`:
//
//   npm run a11y -w frontend            (default http://localhost:5173)
//   A11Y_URL=http://localhost:5173 npm run a11y -w frontend
//
// It scans desktop and phone widths in dark and light mode: the page, the open date
// picker, a confirmation dialog and the admin key dialog. It never confirms anything:
// the Empty Recycle Bin dialog is closed with Escape, and the key dialog comes from an
// Archive the server refuses (no key sent), so nothing on the machine changes.
// Exits 1 when axe finds a violation.
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const URL = process.env.A11Y_URL ?? 'http://localhost:5173';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VIEWPORTS = { desktop: { width: 1400, height: 1000 }, phone: { width: 390, height: 844 } };
const THEMES = ['dark', 'light'];

// Playwright's own Chromium, or the installed Chrome when that build isn't downloaded.
async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: 'chrome' });
  }
}

async function scan(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations) {
    console.log(`  ✗ [${label}] ${v.id} (${v.impact}): ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) console.log(`      ${node.target.join(' ')}`);
  }
  if (violations.length === 0) console.log(`  ✓ ${label}`);
  return violations.length;
}

const browser = await launch();
let failures = 0;

try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((t) => localStorage.setItem('pc-monitor-theme', t), theme);
      const page = await context.newPage();
      const where = `${name}, ${theme}`;
      console.log(where);

      await page.goto(URL);
      // Wait for every panel to have real content, not its loading state.
      await page.getByText(/\d+ of \d+ running/).waitFor();
      await page.getByRole('heading', { name: 'Flush DNS cache' }).waitFor();
      await page.getByText('Loading log entries…').waitFor({ state: 'detached' });
      failures += await scan(page, 'page');

      await page.getByRole('button', { name: /^Dates/ }).click();
      await page.getByRole('grid').waitFor();
      failures += await scan(page, 'date picker open');
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Run Empty Recycle Bin' }).click();
      await page.getByRole('alertdialog').waitFor();
      failures += await scan(page, 'confirm dialog open');
      await page.keyboard.press('Escape'); // never confirm
      await page.getByRole('alertdialog').waitFor({ state: 'detached' });

      const archive = page.getByRole('button', { name: 'Archive' }).locator('visible=true').first();
      if (await archive.count()) {
        await archive.click();
        await page.getByRole('dialog', { name: 'Admin key needed' }).waitFor();
        failures += await scan(page, 'admin key dialog open');
        await page.keyboard.press('Escape');
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nNo accessibility violations.' : `\n${failures} violation(s).`);
process.exit(failures === 0 ? 0 : 1);
