import {text, element, setScreenshot, loadCards} from './cards.js';

const tableBody = document.querySelector('#report-rows');
const query = document.querySelector('#query_string');
const pageSize = document.querySelector('#page-size');
const status = document.querySelector('#list-status');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const pageNumber = document.querySelector('#page-number');
const sortButtons = [...document.querySelectorAll('[data-sort]')];
const collator = new Intl.Collator('ja', {numeric: true, sensitivity: 'base'});
let records = [];
let visible = [];
let page = 0;
let sortKey = '';
let ascending = true;

function showCard(card) {
    for (const [id, field] of Object.entries({title: 'title', contents: 'contents', reference: 'reference',
        user_id: 'user_id', card_id: 'id', created: 'created'})) {
        document.getElementById(id).textContent = text(card[field]);
    }
    document.querySelector('#author').hidden = !text(card.user_id);
    setScreenshot(document.querySelector('#screenshot'), card.screenshot);
}

function render() {
    const size = Number(pageSize.value);
    const pages = Math.max(1, Math.ceil(visible.length / size));
    page = Math.max(0, Math.min(page, pages - 1));
    const fragment = document.createDocumentFragment();
    for (const card of visible.slice(page * size, (page + 1) * size)) {
        const row = element('tr');
        row.append(element('td', card.id));
        const title = element('td');
        const button = element('button', text(card.title) || '（無題）', 'report-title');
        button.type = 'button';
        button.addEventListener('click', () => showCard(card));
        title.append(button);
        row.append(title, element('td', card.reference), element('td', card.count));
        row.addEventListener('click', event => { if (event.target !== button) showCard(card); });
        fragment.append(row);
    }
    tableBody.replaceChildren(fragment);
    status.textContent = visible.length ? `${visible.length} 件中 ${page * size + 1}〜${Math.min((page + 1) * size, visible.length)} 件` : '該当するレポートはありません。';
    pageNumber.textContent = `${page + 1} / ${pages} ページ`;
    previous.disabled = page === 0;
    next.disabled = page >= pages - 1;
    for (const button of sortButtons) {
        button.closest('th').setAttribute('aria-sort', button.dataset.sort === sortKey ? (ascending ? 'ascending' : 'descending') : 'none');
    }
}

function filterAndSort() {
    const term = query.value.trim().toLocaleLowerCase('ja');
    visible = records.filter(card => ['id', 'title', 'reference', 'count'].some(key => text(card[key]).toLocaleLowerCase('ja').includes(term)));
    if (sortKey) visible.sort((a, b) => collator.compare(text(a[sortKey]), text(b[sortKey])) * (ascending ? 1 : -1));
    render();
}

query.addEventListener('input', () => { page = 0; filterAndSort(); });
document.querySelector('#reset_button').addEventListener('click', () => {
    query.value = ''; page = 0; filterAndSort(); query.focus();
});
pageSize.addEventListener('change', () => { page = 0; render(); });
previous.addEventListener('click', () => { page--; render(); });
next.addEventListener('click', () => { page++; render(); });
for (const button of sortButtons) button.addEventListener('click', () => {
    ascending = sortKey === button.dataset.sort ? !ascending : true;
    sortKey = button.dataset.sort;
    page = 0;
    filterAndSort();
});

try {
    records = await loadCards('./servicecard.json');
    filterAndSort();
} catch {
    status.textContent = 'レポートを読み込めませんでした。ページを再読み込みしてください。';
    query.disabled = true;
    pageSize.disabled = true;
    document.querySelector('#reset_button').disabled = true;
    for (const button of sortButtons) button.disabled = true;
}
