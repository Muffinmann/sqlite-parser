import { createBinaryOperationParser } from "./parser";

describe('parser', () => {
  it('parse binary operation expr correctly', () => {
    const p = createBinaryOperationParser()
    const tokens = [
      { type: 'identifier', value: 'table2' },
      { type: 'punctuation', value: '.' },
      { type: 'identifier', value: 'col1' },
      { type: 'operator', value: '=' },
      { type: 'identifier', value: 't2' },
      { type: 'punctuation', value: '.' },
      { type: 'identifier', value: 'col2' },
    ]
    for (const t of tokens) {
      expect(p(t)).toMatchObject(expect.objectContaining({matched: true}))
    }

    const p2 = createBinaryOperationParser()
    const tokens2 = [
      { type: 'identifier', value: 'table2' },
      { type: 'punctuation', value: '.' },
      { type: 'identifier', value: 'col1' },
      { type: 'operator', value: '=' },
      { type: 'literal', value: 't2' },
    ]
    for (const t of tokens2) {
      expect(p2(t)).toMatchObject(expect.objectContaining({matched: true}))
    }
  })
})