// Report fields are untrusted text, never HTML, templates, or executable URLs.
export function text(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = text(value);
    if (className) node.className = className;
    return node;
}

export function screenshotSource(filename) {
    // Encode the entire basename, including literal %, # and ? in archive names.
    // Reject directories and non-PNG files before assigning an image source.
    if (typeof filename !== 'string' || !/^[^/\\\u0000-\u001f\u007f]+\.png$/i.test(filename)) {
        return '../images/no_image_available.png';
    }
    try {
        return './screenshot/' + encodeURIComponent(filename);
    } catch {
        return '../images/no_image_available.png';
    }
}

export function setScreenshot(image, filename) {
    image.alt = 'サービスのスクリーンショット';
    image.onerror = () => {
        image.onerror = null;
        image.src = '../images/no_image_available.png';
    };
    image.src = screenshotSource(filename);
}

export async function loadCards(path) {
    const response = await fetch(path, {credentials: 'omit', redirect: 'error'});
    if (!response.ok) throw new Error('Report data could not be loaded');
    const cards = await response.json();
    if (!Array.isArray(cards) || cards.some(card => !card || typeof card !== 'object' || Array.isArray(card))) {
        throw new Error('Invalid report data');
    }
    return cards;
}
