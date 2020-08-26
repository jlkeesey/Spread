class SheetCol {
  private _col: number

  public constructor(col: number) {
    this._col = col;
  }

  public get display(): string {
    return formatColumnNumber(this._col)
  }

  public get col(): number {
    return this._col
  }

  public set col(val: number) {
    this._col = val
  }
}