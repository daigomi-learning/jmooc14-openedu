import {text, element, setScreenshot, loadCards} from './cards.js';

const list = document.querySelector('#servicecards');
const status = document.querySelector('#cards-status');
try {
    const cards = await loadCards('./top30cards.json');
    const fragment = document.createDocumentFragment();
    for (const card of cards) {
        const item = element('li');
        const container = element('article', undefined, 'card');
        container.append(element('h3', `${text(card.id)} ${text(card.title)}`));
        container.append(element('div', card.contents, 'contents report-text'));
        const image = element('img');
        image.loading = 'lazy';
        image.width = 300;
        setScreenshot(image, card.screenshot);
        container.append(image, element('div', card.reference, 'reference report-text'));
        container.append(element('div', `Posted at ${text(card.created)}`, 'date'));
        item.append(container);
        fragment.append(item);
    }
    list.replaceChildren(fragment);
    status.textContent = `${cards.length} 件のサービス`;
} catch {
    status.textContent = 'レポートを読み込めませんでした。ページを再読み込みしてください。';
}
