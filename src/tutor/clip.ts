export const TRUNCATED = '\n… [truncated]'

export const clip = (text: string, max: number): string =>
  text.length <= max ? text : text.slice(0, Math.max(0, max - TRUNCATED.length)) + TRUNCATED
