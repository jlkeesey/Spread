type ChangedCallback = { (oldValue: string | undefined, newValue: string | undefined): void }
type ChangedCallbackMap = { [name: string]: ChangedCallback }

class Cell {
  private static _nFormatter: Intl.NumberFormat = Intl.NumberFormat(undefined, {
    style: 'decimal',
    useGrouping: true
  })

  private static _dFormatter: Intl.DateTimeFormat = Intl.DateTimeFormat(undefined, {})

  private _col: SheetCol
  private _row: SheetRow

  private _changedCallbacks: ChangedCallbackMap = {}

  private _type: CellValueType = CellValueType.cvt_unset
  private _value: CellValue = ""
  private _formula?: CellFormula

  private _nFormatter?: Intl.NumberFormat
  private _dFormatter?: Intl.DateTimeFormat

  constructor(col: SheetCol, row: SheetRow) {
    this._row = row
    this._col = col

  }

  public get type(): CellValueType {
    return this._type
  }

  public get display(): string {
    return this._col.display + this._row.display
  }

  public get displayValue(): string {
    switch (this.type) {
      case CellValueType.cvt_unset:
        return "";
      case CellValueType.cvt_number:
        return this.formatNumber(this._value as number);
      case CellValueType.cvt_date:
        return this.formatDate();
      case CellValueType.cvt_string:
        return this._value as string;
      case CellValueType.cvt_formula:
        return this.formatNumber(this.evaluate() as number);
    }
  }

  public get editValue(): string {
    switch (this.type) {
      case CellValueType.cvt_unset:
        return "";
      case CellValueType.cvt_number:
        return this.formatNumber(this._value as number);
      case CellValueType.cvt_date:
        return this.formatDate();
      case CellValueType.cvt_string:
        return this._value as string;
      case CellValueType.cvt_formula:
        return this.formatFormula();
    }
  }

  public clearValue(): void {
    this._type = CellValueType.cvt_unset
    this._value = ""
  }

  private changed(oldValue: string | undefined, newValue: string | undefined): void {
    if (oldValue !== newValue) {
      for (let name in this._changedCallbacks) {
        let cb = this._changedCallbacks[name]
        cb(oldValue, newValue)
      }
    }
  }

  public addChangedCallback(name: string, cb: ChangedCallback): void {
    this._changedCallbacks[name] = cb
  }

  public removeChangedCallback(name: string): ChangedCallback {
    let cb = this._changedCallbacks[name]
    delete this._changedCallbacks[name]
    return cb
  }

  public set value(val: CellValue) {
    let num = Number(val)
    if (!isNaN(num)) {
      this.changed(this._value.toString(), val.toString())
      this._type = CellValueType.cvt_number
      this._value = num ;
    } else if (val instanceof Date) {
      this.changed(this._value.toString(), val.toString())
      this._type = CellValueType.cvt_date
      this._value = val
    } else if (typeof val == "string") {
      if (val.length !== 0) {
        if (val.charAt(0) == '=') {
          this.changed(this._formula?.display(), val.slice(1).toString())
          this._type = CellValueType.cvt_formula
          this._formula = this.parseFormula(val.slice(1))
          this.registerListeners(this._formula.referencedCells())
        } else {
          this.changed(this._value.toString(), val.toString())
          this._type = CellValueType.cvt_string
          this._value = val
        }
      }
    }
  }

  private registerListeners(cells: Cell[]) {
    for (let cell of cells) {
      cell.addChangedCallback(this.display, this.dependantChanged)
    }
  }

  private dependantChanged(oldValue: string | undefined, newValue: string | undefined): void {
    this.changed(undefined, this.value?.toString() ?? "")
  }

  public get value(): CellValue {
    switch (this.type) {
      case CellValueType.cvt_unset:
        return 0;
      case CellValueType.cvt_number:
      case CellValueType.cvt_date:
      case CellValueType.cvt_string:
        return this._value
      case CellValueType.cvt_formula:
        return this.evaluate()
    }
  }

  private evaluate(): CellValue {
    return this._formula?.evaluate() || NaN
  }

  private parseFormula(value: string): CellFormula {
    return CellFormula.parse(getSheet(), value)
  }

  private formatFormula(): string {
    if (this._formula === undefined) {
      return "#ERR"
    }
    return '=' + this._formula.display()
  }

  private formatNumber(value: number): string {
    const formatter = this._nFormatter ?? Cell._nFormatter
    return formatter.format(value)
  }

  private formatDate(): string {
    const formatter = this._dFormatter ?? Cell._dFormatter
    return formatter.format(this._value as Date)
  }
}