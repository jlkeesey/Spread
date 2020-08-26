interface CellFormulaNode {
  evaluate(): CellValue
  display(): string
  priority: number
}

abstract class CellFormulaNodeBase implements CellFormulaNode {
  readonly priority: number

  protected constructor(priority: number) {
    this.priority = priority
  }

  abstract evaluate(): CellValue
  abstract display(): string

  protected makeDisplayValue(subPriority: number, str: string): string {
    if (subPriority < this.priority) {
      return '(' + str + ')'
    }
    return str
  }
}

abstract class CellFormulaNodeBinaryBase extends CellFormulaNodeBase {
  readonly lhs: CellFormulaNode
  readonly rhs: CellFormulaNode

  protected constructor(priority: number, lhs: CellFormulaNode, rhs: CellFormulaNode) {
    super(priority)
    this.lhs = lhs
    this.rhs = rhs
  }

  display(): string {
    let lhs = this.makeDisplayValue(this.lhs.priority, this.lhs.display())
    let rhs = this.makeDisplayValue(this.rhs.priority, this.rhs.display())
    return `${lhs} ${this.operator()} ${rhs}`
  }

  protected abstract operator(): string
}

class CellFormulaNodeNumber extends CellFormulaNodeBase {
  private _value: number

  public constructor(value: number) {
    super(50)
    this._value = value
  }

  evaluate(): CellValue {
    return this._value
  }

  display(): string {
    return this._value.toString()
  }
}

class CellFormulaNodeString extends CellFormulaNodeBase {
  private _value: string

  public constructor(value: string) {
    super(50)
    this._value = value
  }

  evaluate(): CellValue {
    return this._value
  }

  display(): string {
    return '"' + this._value + '"'
  }
}

class CellFormulaNodeEmpty extends CellFormulaNodeBase {
  public constructor() {
    super(50)
  }

  evaluate(): CellValue {
    return 0
  }

  display(): string {
    return ""
  }
}

class CellFormulaNodeCell extends CellFormulaNodeBase {
  private _cell: Cell

  public constructor(value: Cell) {
    super(50)
    this._cell = value
  }

  public get cell() {
    return this._cell
  }

  evaluate(): CellValue {
    return this._cell.value
  }

  display(): string {
    return this._cell.display
  }
}

class CellFormulaNodeAdd extends CellFormulaNodeBinaryBase {
  public constructor(lhs: CellFormulaNode, rhs: CellFormulaNode) {
    super(10, lhs, rhs)
  }

  evaluate(): CellValue {
    let lhs = this.lhs.evaluate()
    let rhs = this.rhs.evaluate()
    if (typeof lhs === "string" || typeof rhs === "string") {
      return lhs.toString() + rhs.toString()
    }
    if (typeof lhs === "number" && typeof rhs === "number") {
      return lhs + rhs
    }
    throw new EvalError()
  }

  protected operator(): string {
    return '+'
  }
}

class CellFormulaNodeSubtract extends CellFormulaNodeBinaryBase {
  public constructor(lhs: CellFormulaNode, rhs: CellFormulaNode) {
    super(10, lhs, rhs)
  }

  evaluate(): CellValue {
    let lhs = this.lhs.evaluate()
    let rhs = this.rhs.evaluate()
    if (typeof lhs === "number" && typeof rhs === "number") {
      return lhs - rhs
    }
    throw new EvalError()
  }

  protected operator(): string {
    return '-'
  }
}

class CellFormulaNodeMultiply extends CellFormulaNodeBinaryBase {
  public constructor(lhs: CellFormulaNode, rhs: CellFormulaNode) {
    super(20, lhs, rhs)
  }

  evaluate(): CellValue {
    let lhs = this.lhs.evaluate()
    let rhs = this.rhs.evaluate()
    if (typeof lhs === "number" && typeof rhs === "number") {
      return lhs * rhs
    }
    throw new EvalError()
  }

  protected operator(): string {
    return '*'
  }
}

class CellFormulaNodeDivide extends CellFormulaNodeBinaryBase {
  public constructor(lhs: CellFormulaNode, rhs: CellFormulaNode) {
    super(20, lhs, rhs)
  }

  evaluate(): CellValue {
    let lhs = this.lhs.evaluate()
    let rhs = this.rhs.evaluate()
    if (typeof lhs === "number" && typeof rhs === "number") {
      return lhs / rhs
    }
    throw new EvalError()
  }

  protected operator(): string {
    return '/'
  }
}

enum TokenType {
  eof = 0,
  number = 1,
  string = 2,
  symbol = 3,
  cell = 4
}

class Token {
  public static readonly EOF: Token = new Token(TokenType.eof, undefined)

  public readonly type: TokenType
  public readonly num?: number
  public readonly str?: string
  public readonly col?: number
  public readonly row?: number

  public constructor(
    tokenType: TokenType,
    value: number | string | undefined = undefined,
    col: number | undefined = undefined,
    row: number | undefined = undefined
  ) {
    this.type = tokenType
    if (typeof value === "number") {
      this.num = value
    } else {
      this.str = value
    }
    this.col = col
    this.row = row
  }

  public match(type: TokenType, value: number | string | undefined = undefined): boolean {
    if (this.type !== type) {
      return false
    }
    if (value !== undefined) {
      if (this.type === TokenType.number) {
        return this.num === value as number
      } else {
        return this.str === value as string
      }
    }
    return true
  }
}

class Tokenizer {
  private static readonly MATCH_DIGIT: RegExp = /[0-9]/
  private static readonly MATCH_NUMBER: RegExp = /^([0-9]+(\.[0-9]*)?)/
  private static readonly MATCH_SYMBOL: RegExp = /^([+*/-])/
  private static readonly MATCH_CELL_REF: RegExp = /^([A-Za-z]+)([0-9]+)/

  private _string: string
  private _position: number = 0
  private _current: Token | undefined = undefined

  public constructor(s: string) {
    this._string = s
    this.next() // Prime the pump
  }

  public get eof(): boolean {
    return this._position >= this._string.length || Object.is(this._current, Token.EOF)
  }

  public get token(): Token {
    if (this._current === undefined) {
      this.next()
    }
    return this._current ?? Token.EOF
  }

  public match(type: TokenType, value?: number | string): boolean {
    if (!this._current?.match(type, value)) {
      return false
    }
    this.next()
    return true
  }

  public next(): void {
    this.skipWhitespace()
    if (this.eof) {
      this._current = Token.EOF
    } else {
      let ch = this._string.charAt(this._position)
      if (ch === '"' || ch === "'") {
        this._current = this.nextString(ch)
      } else if (Tokenizer.MATCH_DIGIT.test(ch)) {
        this._current = this.nextNumber()
      } else {
        let token = this.nextCellRef()
        if (token.type === TokenType.eof) {
          token = this.nextSymbol()
        }
        this._current = token
      }
    }
  }

  private nextSymbol(): Token {
    let str = this._string.slice(this._position)
    let parts = str.match(Tokenizer.MATCH_SYMBOL)
    if (parts !== null && parts.length > 1) {
      let symbol = parts[0]
      this._position += parts[0].length
      return new Token(TokenType.symbol, symbol)
    }
    return Token.EOF
  }

  private nextCellRef(): Token {
    let str = this._string.slice(this._position)
    let parts = str.match(Tokenizer.MATCH_CELL_REF)
    if (parts !== null && parts.length > 2) {
      let col = parseColumnNumber(parts[1])
      let row = parseInt(parts[2]) - 1
      this._position += parts[0].length
      return new Token(TokenType.cell, undefined, col, row)
    }
    return Token.EOF
  }

  private nextNumber(): Token {
    let str = this._string.slice(this._position)
    let parts = str.match(Tokenizer.MATCH_NUMBER)
    if (parts !== null && parts.length > 2) {
      let value = parseFloat(parts[1])
      this._position += parts[1].length
      return new Token(TokenType.number, value)
    }
    return Token.EOF
  }

  private skipWhitespace(): void {
    while (this._position < this._string.length) {
      let ch = this._string.charAt(this._position)
      if (ch !== ' ' && ch !== '\t') {
        break;
      }
      this._position++
    }
  }

  private nextString(end: string) {
    let str: string[] = []
    this._position++ // Skip open quote
    while (this._position < this._string.length) {
      let ch = this._string[this._position++];
      if (ch === end) {
        break
      }
      str.push(ch)
    }
    let s = str.reverse().join('')
    this._position += s.length - 1
    return new Token(TokenType.string, s)
  }
}

class CellFormula {
  private formula: CellFormulaNode

  public constructor(node: CellFormulaNode) {
    this.formula = node
  }

  public display(): string {
    return this.formula.display()
  }

  public evaluate(): CellValue {
    return this.formula.evaluate()
  }

  public referencedCells(): Cell[] {
    let cells: Cell[] = []
    this.gatherCells(cells, this.formula)
    return cells
  }

  private gatherCells(cells: Cell[], node: CellFormulaNode) {
    if (node instanceof CellFormulaNodeBinaryBase) {
      this.gatherCells(cells, node.lhs)
      this.gatherCells(cells, node.rhs)
    } else if (node instanceof CellFormulaNodeCell) {
      cells.push(node.cell)
    }
  }

  public static parse(sheet: Sheet, value: string): CellFormula {
    let tokenizer = new Tokenizer(value)
    if (tokenizer.eof) {
      return new CellFormula(new CellFormulaNodeEmpty())
    }
    let expr = this.parseAddSubtract(sheet, tokenizer)
    if (!tokenizer.eof) {
      throw new SyntaxError();
    }
    return new CellFormula(expr)
  }

  private static parseAddSubtract(sheet: Sheet, tokenizer: Tokenizer): CellFormulaNode {
    let lhs = this.parseMultiplyDivide(sheet, tokenizer)
    while (!tokenizer.eof) {
      if (tokenizer.match(TokenType.symbol, '+')) {
        lhs = new CellFormulaNodeAdd(lhs, this.parseMultiplyDivide(sheet, tokenizer))
      } else if (tokenizer.match(TokenType.symbol, '-')) {
        lhs = new CellFormulaNodeSubtract(lhs, this.parseMultiplyDivide(sheet, tokenizer))
      } else {
        break
      }
    }
    return lhs
  }

  private static parseMultiplyDivide(sheet: Sheet, tokenizer: Tokenizer): CellFormulaNode {
    let lhs = this.parseMultiplyAtom(sheet, tokenizer)
    while (!tokenizer.eof) {
      if (tokenizer.match(TokenType.symbol, '*')) {
        lhs = new CellFormulaNodeMultiply(lhs, this.parseMultiplyAtom(sheet, tokenizer))
      } else if (tokenizer.match(TokenType.symbol, '/')) {
        lhs = new CellFormulaNodeDivide(lhs, this.parseMultiplyAtom(sheet, tokenizer))
      } else {
        break
      }
    }
    return lhs
  }

  private static parseMultiplyAtom(sheet: Sheet, tokenizer: Tokenizer): CellFormulaNode {
    let token = tokenizer.token
    if (tokenizer.match(TokenType.cell)) {
      let cell = sheet.cell(token.col ?? 0, token.row ?? 0) // Add better error checking
      if (cell === undefined) {
        throw new SyntaxError()
      }
      return new CellFormulaNodeCell(cell)
    } else if (tokenizer.match(TokenType.number)) {
      return new CellFormulaNodeNumber(token.num ?? 0) // Add better error checking
    } else if (tokenizer.match(TokenType.string)) {
      return new CellFormulaNodeString(token.str ?? "") // Add better error checking
    } else {
      throw new SyntaxError()
    }
  }
}