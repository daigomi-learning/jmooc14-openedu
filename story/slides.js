// Local slide navigation. Hash values are parsed as numbers, never markup.
const slides = [...document.querySelectorAll('.slide')];
const controls = document.createElement('nav');
controls.className = 'slide-controls';
controls.setAttribute('aria-label', 'レポートのページ操作');
const previous = document.createElement('button');
previous.type = 'button';
previous.textContent = '前へ';
const status = document.createElement('span');
status.setAttribute('aria-live', 'polite');
const next = document.createElement('button');
next.type = 'button';
next.textContent = '次へ';
const all = document.createElement('button');
all.type = 'button';
all.textContent = 'すべて表示';
controls.append(previous, status, next, all);
document.body.prepend(controls);
let current = 0;
let showAll = false;

function render() {
    slides.forEach((slide, index) => { slide.hidden = !showAll && index !== current; });
    status.textContent = `${current + 1} / ${slides.length}`;
    previous.disabled = showAll || current === 0;
    next.disabled = showAll || current === slides.length - 1;
    all.textContent = showAll ? 'スライド表示' : 'すべて表示';
    all.setAttribute('aria-pressed', String(showAll));
}

function readHash() {
    // Keep existing Slidy #(<number>) bookmarks working.
    const match = /^#(?:\((\d+)\)|(\d+))$/.exec(window.location.hash);
    const requested = match ? Number(match[1] || match[2]) : 1;
    current = Number.isSafeInteger(requested) ? Math.max(0, Math.min(requested - 1, slides.length - 1)) : 0;
    render();
}

function move(offset) {
    if (showAll) return;
    current = Math.max(0, Math.min(current + offset, slides.length - 1));
    window.location.hash = `(${current + 1})`;
    render();
    window.scrollTo(0, 0);
}

previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
all.addEventListener('click', () => { showAll = !showAll; render(); });
document.addEventListener('keydown', event => {
    if (showAll || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
    if (['ArrowRight', 'PageDown', ' ', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        move(['ArrowLeft', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 1);
    }
});
document.addEventListener('click', event => {
    if (event.button === 0 && !event.target.closest('a, button, input, textarea, select, [contenteditable]') && !window.getSelection().toString()) move(event.shiftKey ? -1 : 1);
});
window.addEventListener('hashchange', readHash);
readHash();
