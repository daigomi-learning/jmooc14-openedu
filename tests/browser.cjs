/* Run against a local HTTP server: node tests/browser.cjs [http://127.0.0.1:8765]
 * Requires Playwright and its Chromium browser (test tooling only).
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
const origin = new URL(base).origin;
const root = path.resolve(__dirname, '..');
const records = JSON.parse(fs.readFileSync(path.join(root, 'service/servicecard.json'), 'utf8'));
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
let browser;
let passed = 0;
async function context(options = {}) {
    const result = await browser.newContext(options);
    await result.route('**/*', route => {
        if (new URL(route.request().url()).origin !== origin) return route.abort();
        return route.continue();
    });
    return result;
}
async function test(name, callback, options = {}) {
    const ctx = await context(options);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        await callback(page, ctx);
        assert.deepEqual(errors, [], 'JavaScript errors');
        passed++;
        console.log('PASS', name);
    } finally { await ctx.close(); }
}
async function listReady(page) {
    await page.goto(base + '/service/list.html');
    await page.locator('#report-rows tr').first().waitFor();
}
async function main() {
    browser = await chromium.launch({headless: true});
    await test('real reports: load, details, search, reset, numeric sorting and pagination', async page => {
        await listReady(page);
        assert.match(await page.locator('#list-status').innerText(), /5035 件中 1〜25 件/);
        assert.equal(await page.locator('#report-rows tr').count(), 25);
        await page.locator('.report-title').first().click();
        assert.equal(await page.locator('#title').innerText(), records[0].title);
        assert.equal(await page.locator('#contents').textContent(), records[0].contents);
        assert.equal(await page.locator('#reference').textContent(), records[0].reference);
        assert.equal(await page.locator('#author').isVisible(), false);
        await page.waitForFunction(() => document.querySelector('#screenshot').complete && document.querySelector('#screenshot').naturalWidth > 0);
        await page.locator('#next-page').click();
        assert.match(await page.locator('#list-status').innerText(), /26〜50/);
        await page.locator('#previous-page').click();
        await page.locator('#page-size').selectOption('50');
        assert.equal(await page.locator('#report-rows tr').count(), 50);
        await page.locator('#page-size').selectOption('100');
        assert.equal(await page.locator('#report-rows tr').count(), 100);
        await page.locator('#query_string').fill('manavee');
        const expected = records.filter(c => ['id', 'title', 'reference', 'count'].some(k => String(c[k]).toLowerCase().includes('manavee'))).length;
        assert.match(await page.locator('#list-status').innerText(), new RegExp(`^${expected} 件中`));
        await page.locator('#query_string').fill('<img src=x onerror=alert(1)>');
        assert.equal(await page.locator('#report-rows tr').count(), 0);
        assert.equal(await page.locator('#next-page').isDisabled(), true);
        await page.locator('#reset_button').click();
        await page.locator('[data-sort="count"]').click();
        const counts = await page.locator('#report-rows tr td:last-child').allTextContents();
        assert.deepEqual(counts.map(Number), counts.map(Number).sort((a, b) => a - b));
        await page.locator('[data-sort="count"]').click();
        assert.equal(Number(await page.locator('#report-rows tr td:last-child').first().innerText()), Math.max(...records.map(c => c.count)));
        if (process.env.SECURITY_SCREENSHOTS) {
            await page.screenshot({path: path.join(process.env.SECURITY_SCREENSHOTS, 'reports-desktop.png'), fullPage: false});
            await page.setViewportSize({width: 390, height: 844});
            await page.screenshot({path: path.join(process.env.SECURITY_SCREENSHOTS, 'reports-mobile.png'), fullPage: false});
        }
    });
    await test('31 selected cards and all three statistics tables', async page => {
        await page.goto(base + '/service/top31.html');
        await page.locator('#servicecards .card').first().waitFor();
        assert.equal(await page.locator('#servicecards .card').count(), 31);
        const selected = JSON.parse(fs.readFileSync(path.join(root, 'service/top30cards.json'), 'utf8'));
        assert.equal(await page.locator('#servicecards .contents').first().textContent(), selected[0].contents);
        await page.goto(base + '/service/servicecard.html');
        for (const name of ['titles', 'locations', 'words']) {
            const table = page.locator('#statistics-' + name);
            assert.ok(await table.locator('tbody tr').count() >= 30);
            const sort = table.locator('th button').nth(1);
            await sort.click();
            const counts = (await table.locator('tbody td:last-child').allTextContents()).map(Number);
            assert.deepEqual(counts, [...counts].sort((a, b) => a - b));
            await sort.click();
            assert.equal(Number(await table.locator('tbody td:last-child').first().innerText()), Math.max(...counts));
        }
    });
    await test('770 slides: bookmarks, buttons, keyboard, all view and hostile hash', async page => {
        await page.goto(base + '/story/contents.html#(2)');
        await page.locator('.slide-controls').waitFor();
        assert.equal(await page.locator('.slide').count(), 770);
        assert.equal(await page.locator('.slide:not([hidden])').count(), 1);
        assert.equal(await page.locator('.slide-controls span').innerText(), '2 / 770');
        await page.locator('.slide-controls button').nth(1).click();
        assert.equal(await page.locator('.slide-controls span').innerText(), '3 / 770');
        await page.locator('.slide-controls button').nth(1).evaluate(node => node.blur());
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('.slide-controls span').innerText(), '2 / 770');
        await page.locator('.slide-controls button').nth(2).click();
        assert.equal(await page.locator('.slide:not([hidden])').count(), 770);
        await page.locator('.slide-controls button').nth(2).click();
        await page.goto(base + '/story/contents.html#%3Cimg%20src=x%20onerror=window.XSS=1%3E');
        await page.locator('.slide-controls').waitFor();
        assert.equal(await page.locator('.slide-controls span').innerText(), '1 / 770');
        assert.equal(await page.evaluate(() => window.XSS), undefined);
        await page.emulateMedia({media: 'print'});
        assert.equal(await page.locator('.slide:visible').count(), 770);
    });
    await test('hostile report fields remain text even without CSP', async (page, ctx) => {
        const attack = {
            id: '<img src=x onerror="window.XSS=1">',
            title: '<svg onload="window.XSS=1">',
            contents: '</div><script>window.XSS=1</script><iframe src="https://evil.invalid/">',
            reference: 'javascript:window.XSS=1',
            user_id: '<img src=x onerror="window.XSS=1">',
            created: '<a href="javascript:window.XSS=1">x</a>',
            count: '{{constructor.constructor("window.XSS=1")()}}',
            screenshot: '../../index.html'
        };
        await ctx.route('**/service/servicecard.json', route => route.fulfill({json: [attack]}));
        await ctx.route('**/service/top30cards.json', route => route.fulfill({json: [attack]}));
        const requests = [];
        page.on('request', req => requests.push(req.url()));
        await listReady(page);
        await page.locator('.report-title').click();
        for (const [id, key] of Object.entries({title: 'title', contents: 'contents', reference: 'reference', user_id: 'user_id', card_id: 'id', created: 'created'})) {
            assert.equal(await page.locator('#' + id).textContent(), attack[key]);
            assert.equal(await page.locator('#' + id + ' *').count(), 0);
        }
        assert.match(await page.locator('#screenshot').getAttribute('src'), /no_image_available\.png$/);
        assert.equal(await page.evaluate(() => window.XSS), undefined);
        await page.goto(base + '/service/top31.html');
        await page.locator('#servicecards .card').waitFor();
        assert.equal(await page.locator('#servicecards .contents').textContent(), attack.contents);
        assert.equal(await page.locator('#servicecards script, #servicecards iframe, #servicecards svg, #servicecards a').count(), 0);
        assert.equal(await page.evaluate(() => window.XSS), undefined);
        assert.ok(requests.every(url => new URL(url).origin === origin));
        assert.ok(requests.every(url => !url.includes('/x')));
    }, {bypassCSP: true});
    await test('image path traversal, external URLs and reserved filename characters', async (page, ctx) => {
        const invalid = ['../../index.html', '..\\secret.png', '//evil.invalid/a.png', 'https://evil.invalid/a.png', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'evil.svg', 'x\u0000.png', '\ud800.png', null, {}];
        const literal = ['http_example.com__x?y=1#z.png', 'http_example.com__%2e%2e%2fprivate.png', '日本語.png'];
        const data = [...invalid, ...literal].map((screenshot, i) => ({id: i, title: String(i), screenshot}));
        await ctx.route('**/service/servicecard.json', route => route.fulfill({json: data}));
        await ctx.route('**/service/screenshot/**', route => route.fulfill({contentType: 'image/png', body: tinyPng}));
        await listReady(page);
        for (let i = 0; i < data.length; i++) {
            await page.locator('.report-title').nth(i).click();
            const src = await page.locator('#screenshot').getAttribute('src');
            if (i < invalid.length) assert.equal(src, '../images/no_image_available.png');
            else {
                const resolved = new URL(src, base + '/service/list.html');
                assert.equal(resolved.origin, origin);
                assert.equal(resolved.search, '');
                assert.equal(resolved.hash, '');
                assert.equal(decodeURIComponent(resolved.pathname.slice('/service/screenshot/'.length)), data[i].screenshot);
            }
        }
    });
    await test('JSON errors, unexpected shapes and missing screenshots fail safely', async (page, ctx) => {
        for (const body of ['not json', '{}', '[null]', '[[]]']) {
            await ctx.route('**/service/servicecard.json', route => route.fulfill({contentType: 'application/json', body}));
            await page.goto(base + '/service/list.html');
            await page.getByText('レポートを読み込めませんでした。ページを再読み込みしてください。').waitFor();
            assert.equal(await page.locator('#query_string').isDisabled(), true);
            await ctx.unroute('**/service/servicecard.json');
        }
        await ctx.route('**/service/servicecard.json', route => route.fulfill({status: 500, body: 'error'}));
        await page.goto(base + '/service/list.html');
        await page.getByText('レポートを読み込めませんでした。ページを再読み込みしてください。').waitFor();
        await ctx.unroute('**/service/servicecard.json');
        await ctx.route('**/service/servicecard.json', route => route.fulfill({json: [{id: 1, title: 'missing', screenshot: 'missing-test-image.png'}]}));
        await listReady(page);
        await page.locator('.report-title').click();
        await page.waitForFunction(() => document.querySelector('#screenshot').getAttribute('src') === '../images/no_image_available.png');
    });
    await test('CSP rejects inline scripts, event handlers and external scripts', async page => {
        await page.goto(base + '/index.html');
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.textContent = 'window.CSP_BYPASS = true';
            document.body.append(script);
            const button = document.createElement('button');
            button.setAttribute('onclick', 'window.CSP_BYPASS = true');
            document.body.append(button);
            button.click();
            window.violations = [];
            document.addEventListener('securitypolicyviolation', event => window.violations.push(event.violatedDirective));
            const external = document.createElement('script');
            external.src = 'https://evil.invalid/attack.js';
            document.body.append(external);
        });
        await page.waitForFunction(() => window.violations.includes('script-src-elem'));
        assert.equal(await page.evaluate(() => window.CSP_BYPASS), undefined);
    });
    await test('all 33 application pages load with local scripts and no CSP errors', async page => {
        const pages = [];
        function collect(dir) {
            for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
                if (entry.isSymbolicLink() || entry.name === 'lib' || entry.name === '.git') continue;
                const file = path.join(dir, entry.name);
                if (entry.isDirectory()) collect(file);
                else if (entry.name.endsWith('.html')) pages.push(path.relative(root, file));
            }
        }
        collect(root);
        const failures = [];
        page.on('console', message => { if (/Content Security Policy|violates.*directive|Refused to/.test(message.text())) failures.push(message.text()); });
        for (const file of pages) {
            const response = await page.goto(base + '/' + file);
            assert.equal(response.status(), 200, file);
            await page.waitForLoadState('networkidle');
            const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src));
            assert.ok(scripts.every(url => new URL(url).origin === origin));
        }
        assert.equal(pages.length, 33);
        assert.deepEqual(failures, []);
    });
    console.log(`All ${passed} browser checks passed.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
