// Sortable headers and collapsible sections for tables in page content, ported
// from the old jQuery table handling. Everything here is plain DOM because the
// tables arrive as rendered markdown.

const BASE = '▸ '
const DOWN = '▾ '
const UP = '▴ '

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

function label(th: HTMLElement) {
  const text = th.textContent ?? ''

  return [BASE, DOWN, UP].some(mark => text.startsWith(mark)) ? text.slice(BASE.length) : text
}

function cellValue(row: HTMLTableRowElement, index: number): string | number {
  const text = (row.cells[index]?.textContent ?? '').toLowerCase()

  // Dates like "July 20, 2017" sort by time, not alphabetically
  if (MONTHS.some(month => text.startsWith(month.slice(0, 3))))
    return Date.parse(text)

  return text
}

function sort(th: HTMLTableCellElement) {
  const tbody = th.closest('tbody')

  if (!tbody)
    return

  // Unsorted and ascending columns flip to ascending, descending back again
  const ascending = !th.textContent?.startsWith(DOWN)

  for (const other of tbody.querySelectorAll('th'))
    other.textContent = BASE + label(other)

  th.textContent = (ascending ? DOWN : UP) + label(th)

  const index = th.cellIndex
  const rows = [...tbody.rows].filter(row => !row.querySelector('th') && !row.classList.contains('collapsible-handle'))

  rows.sort((a, b) => {
    const va = cellValue(a, index)
    const vb = cellValue(b, index)
    const order = va > vb ? 1 : va < vb ? -1 : 0

    return ascending ? order : -order
  })

  tbody.append(...rows)
}

function toggle(handle: HTMLTableRowElement) {
  const active = handle.getAttribute('active') !== 'false'

  handle.setAttribute('active', active ? 'false' : 'true')
  setCollapsed(handle, active)
}

function setCollapsed(handle: HTMLTableRowElement, collapsed: boolean) {
  let row = handle.nextElementSibling as HTMLElement | null

  while (row) {
    row.style.display = collapsed ? 'none' : ''
    row = row.nextElementSibling as HTMLElement | null
  }
}

export function prepareTables(root: HTMLElement) {
  for (const th of root.querySelectorAll<HTMLTableCellElement>('th')) {
    th.textContent = BASE + label(th)
    th.style.cursor = 'pointer'
  }

  for (const handle of root.querySelectorAll<HTMLTableRowElement>('.collapsible-handle')) {
    handle.style.display = 'table-row'
    setCollapsed(handle, handle.getAttribute('active') === 'false')
  }
}

export function onTableClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  const handle = target.closest<HTMLTableRowElement>('.collapsible-handle')

  if (handle) {
    toggle(handle)
    return
  }

  const th = target.closest<HTMLTableCellElement>('th')

  if (th)
    sort(th)
}
