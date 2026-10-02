import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view'

export const setErrorLine = StateEffect.define<number | null>()
export const flashLine = StateEffect.define<number | null>()

const errorMark = Decoration.line({ class: 'cm-errorLine' })
const flashMark = Decoration.line({ class: 'cm-flashLine' })

function lineField(effect: typeof setErrorLine, mark: Decoration, clearOnEdit: boolean) {
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(deco, tr) {
      let next = clearOnEdit && tr.docChanged ? Decoration.none : deco.map(tr.changes)
      for (const e of tr.effects) {
        if (!e.is(effect)) continue
        const n = e.value
        next =
          n !== null && n >= 1 && n <= tr.state.doc.lines
            ? Decoration.set([mark.range(tr.state.doc.line(n).from)])
            : Decoration.none
      }
      return next
    },
    provide: (f) => EditorView.decorations.from(f),
  })
}

/** Line backgrounds for the load-error line (cleared on edit) and jump-to-line flashes. */
export const lineMarks = [lineField(setErrorLine, errorMark, true), lineField(flashLine, flashMark, true)]
