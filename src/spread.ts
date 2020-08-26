let __sheet: Sheet | null = null

// This is to break a cycle because I didn't go to the effort to make modules.
function getSheet(): Sheet {
  if (__sheet === null) {
    __sheet = new Sheet()
  }
  return __sheet
}
