function generateTable(parent: HTMLElement) {
  const table = createTable(getSheet())
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild)
  }
  parent.appendChild(table)
}

function createTable(sheet: Sheet): HTMLElement {
  const table = document.createElement("table")
  table.setAttribute("class", "spreadsheet")
  createHeader(table, sheet)
  createRows(table, sheet)
  return table
}

function createHeader(table: HTMLTableElement, sheet: Sheet): void {
  const thead = table.createTHead()
  const row = thead.insertRow()

  let th = document.createElement('th')
  th.setAttribute("class", "row-number")
  th.innerHTML = "&nbsp;"
  row.appendChild(th)

  for (const col of sheet.cols) {
    let label = col.display
    th = document.createElement('th')
    th.innerHTML = label
    row.appendChild(th)
  }

  th = document.createElement('th')
  th.setAttribute("class", "filler")
  th.innerHTML = "&nbsp;"
  row.appendChild(th)
}

function createRows(table: HTMLTableElement, sheet: Sheet): void {
  const tbody = table.createTBody()

  for (const row of sheet.rows) {
    const trow = tbody.insertRow()

    let label = row.display
    let td = document.createElement('td')
    td.setAttribute("class", "row-number")
    td.innerHTML = label
    trow.appendChild(td)

    for (const col of sheet.cols) {
      let cell = sheet.cell(col.col, row.row) as Cell
      td = document.createElement('td')
      td.setAttribute("class", "number")
      td.setAttribute("data-cell-id", cell.display)
      td.onclick = function (event) { handleClick(cell.display, event.target) }
      td.innerHTML = cell.displayValue
      trow.appendChild(td)
    }

    td = document.createElement('td')
    td.setAttribute("class", "filler")
    td.innerHTML = "&nbsp;"
    trow.appendChild(td)
  }
}

function handleClick(id: string, target: EventTarget | null): void {
  if (target === null) {
    return;
  }
  let t = target as HTMLElement
  let entry = document.getElementById("entry") as HTMLDivElement
  let bounds = t.getBoundingClientRect()
  entry.style.top = bounds.top + "px"
  entry.style.height = bounds.height - 1 + "px"
  entry.style.left = bounds.left + "px"
  entry.style.width = bounds.width - 1 + "px"
  let entryInput = document.getElementById("entry-input") as HTMLInputElement
  const cell = getSheet().cellByAddress(id)
  entryInput.value = cell.editValue
  entryInput.focus()
  entryInput.select()
  entryInput.onchange = function (event) { handleChange(entry, t, id, (event.target as HTMLInputElement).value) }
  entry.classList.remove("hidden")
}

function handleChange(entry: HTMLDivElement, target: HTMLElement, id: string, newValue: string): void {
  const cell = getSheet().cellByAddress(id)
  if (cell !== undefined) {
    if (newValue === "") {
      cell.clearValue()
      target.innerText = cell.displayValue
    } else {
      cell.value = newValue
      target.innerText = cell.displayValue
    }
  }
  entry.classList.add("hidden")
}