const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export const shortcuts = {
  runTests: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
  runFile: isMac ? 'Cmd+Shift+Enter' : 'Ctrl+Shift+Enter',
}
