
class Sheet {
    public readonly START_COLS: number = 20
    public readonly START_ROWS: number = 20

    private _cols: SheetCol[] = []
    private _rows: SheetRow[] = []

    private _cells: Cell[][]

    public constructor() {
        this._cols = new Array(this.START_COLS)
        for (let c = 0; c < this.START_COLS; c++) {
            this._cols[c] = new SheetCol(c)
        }

        this._rows = new Array(this.START_ROWS)
        for (let r = 0; r < this.START_ROWS; r++) {
            this._rows[r] = new SheetRow(r)
        }

        this._cells = new Array(this.START_COLS)
        for (let c = 0; c < this.START_COLS; c++) {
            this._cells[c] = new Array(this.START_ROWS)
            for (let r = 0; r < this.START_ROWS; r++) {
                this._cells[c][r] = new Cell(this._cols[c], this._rows[r])
            }
        }
    }

    public cell(col: number, row: number): Cell | undefined {
        if (col < 0 || this._cols.length <= col) {
            return undefined
        }
        if (row < 0 || this._rows.length <= row) {
            return undefined
        }
        return this._cells[col][row]
    }

    public cellByAddress(ind: string): Cell | undefined {
        let parts = ind.match(/^([a-zA-Z]+)([0-9]+)$/)
        if (parts === null || parts.length < 3) {
            throw new RangeError()
        }
        let col = parseColumnNumber(parts[1])
        let row = parseInt(parts[2]) - 1
        return this.cell(col, row);
    }

    // Normally I'd hide this better
    public get cols(): SheetCol[] {
        return this._cols
    }

    // Normally I'd hide this better
    public get rows(): SheetRow[] {
        return this._rows
    }

    public addCols(colAfter: number, count: number) {
        let args: [number, number, ...any[]] = [colAfter + 1, 0]
        for (let c = 0; c < count; c++) {
            args.push(new SheetCol(c))
        }
        Array.prototype.splice.apply(this._cols, args)
        for (let c = 0; c < this._cols.length; c++) {
            this._cols[c].col = c
        }

        args = [colAfter + 1, 0]
        for (let c = 0; c < count; c++) {
            args.push(new Array(this._rows.length))
        }
        Array.prototype.splice.apply(this._cells, args)

        for (let c = 0; c < this._cells.length; c++) {
            for (let r = 0; r < this._rows.length; r++) {
                this._cells[c][r] = new Cell(this._cols[c], this._rows[r])
            }
        }
    }

    public addRows(rowAfter: number, count: number) {
        let args: [number, number, ...any[]] = [rowAfter + 1, 0]
        for (let r = 0; r < count; r++) {
            args.push(new SheetRow(r))
        }
        Array.prototype.splice.apply(this._rows, args)
        for (let r = 0; r < this._rows.length; r++) {
            this._rows[r].row = r
        }

        for (let c = 0; c < this._cells.length; c++) {
            let args: [number, number, ...any[]] = [rowAfter + 1, 0]
            for (let r = 0; r < count; r++) {
                args.push(new Cell(this._cols[c], this._rows[rowAfter + r]))
            }
            Array.prototype.splice.apply(this._cells[c], args)
        }
    }
}