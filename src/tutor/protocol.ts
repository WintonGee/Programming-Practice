// Contract between the browser and the Worker at POST /api/tutor. Shared by both sides.

export const TUTOR_ENDPOINT = '/api/tutor'

export const LIMITS = {
  messages: 30,
  messageChars: 8_000,
  codeChars: 30_000,
  promptChars: 20_000,
  failures: 10,
  summaryChars: 200,
  titleChars: 200,
  failureNameChars: 200,
  failureDocChars: 500,
  failureMessageChars: 2_000,
  failureCodeChars: 500,
  loadErrorChars: 2_000,
  earlierStages: 10,
  difficultyChars: 20,
  bodyBytes: 200_000,
} as const

export type TutorMode = 'practice' | 'interview'

export interface TestFailure {
  stage: number
  name: string
  /** Human description of the test (its docstring). */
  doc: string
  message: string
  /** The failing line in the test file. */
  code: string
}

export interface LastRun {
  /** e.g. "9 of 11 passing" or "Code didn't load". */
  summary: string
  failures: TestFailure[]
  /** Set when the code failed to compile or import. */
  loadError?: string
}

export interface ProblemContext {
  kind: 'problem'
  mode: TutorMode
  problemTitle: string
  difficulty: string
  stageNumber: number
  stageCount: number
  stageTitle: string
  /** Markdown prompt of the current stage. */
  prompt: string
  /** Titles of earlier stages, in order (their tests still run). */
  earlierStages: string[]
  code: string
  lastRun?: LastRun
}

export interface GeneralContext {
  kind: 'general'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TutorRequest {
  context: ProblemContext | GeneralContext
  /** Oldest first; the last message is the user's new question. */
  messages: ChatMessage[]
}

/** Server-sent events, one JSON object per `data:` line. */
export type TutorEvent =
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
