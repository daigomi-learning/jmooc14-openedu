// Statistics are escaped into static HTML; sorting reads only visible text.
const collator = new Intl.Collator('ja', {numeric: true, sensitivity: 'base'});
for (const table of document.querySelectorAll('.statistics-table')) {
    for (const button of table.querySelectorAll('th button')) {
        button.addEventListener('click', () => {
            const heading = button.closest('th');
            const ascending = heading.getAttribute('aria-sort') !== 'ascending';
            const column = heading.cellIndex;
            const rows = [...table.tBodies[0].rows];
            rows.sort((a, b) => collator.compare(a.cells[column].textContent, b.cells[column].textContent) * (ascending ? 1 : -1));
            table.tBodies[0].replaceChildren(...rows);
            for (const cell of table.querySelectorAll('th')) cell.setAttribute('aria-sort', 'none');
            heading.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
        });
    }
}
