class SheetRow {
  private _row: number

  public constructor(row: number) {
    this._row = row;
  }

  public get display(): string {
    return (this._row + 1).toString();
  }

  public get row(): number {
    return this._row;
  }

  public set row(val: number) {
    this._row = val
  }
}