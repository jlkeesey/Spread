const columnLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function parseColumnNumber(value: string): number {
  let result = 0
  for (let i = 0; i < value.length; i++) {
    let ch = value.charAt(i).toUpperCase()
    result *= 26
    result += columnLetters.indexOf(ch)
  }
  return result
}

function formatColumnNumber(value: number): string {
  if (value === 0) {
    return 'A'
  }
  let digits: string[] = []
  while (value > 0) {
    let remainder = value % 26
    value = Math.trunc(value / 26)
    digits.push(columnLetters.charAt(remainder))
  }
  return digits.reverse().join('')
}