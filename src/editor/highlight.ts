import { tagHighlighter, tags as t } from '@lezer/highlight'

/** Maps syntax tags to `tk-*` classes; colors live in index.css so editor and static code share one palette per theme. */
export const highlighter = tagHighlighter([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier], class: 'tk-kw' },
  { tag: [t.number, t.bool, t.null], class: 'tk-num' },
  { tag: t.string, class: 'tk-str' },
  { tag: [t.special(t.string), t.escape], class: 'tk-str2' },
  { tag: t.comment, class: 'tk-com' },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName))],
    class: 'tk-fn',
  },
  { tag: [t.definition(t.className), t.className, t.typeName], class: 'tk-type' },
  { tag: t.meta, class: 'tk-meta' },
  { tag: t.operator, class: 'tk-op' },
  { tag: t.punctuation, class: 'tk-punc' },
  { tag: t.propertyName, class: 'tk-prop' },
])
