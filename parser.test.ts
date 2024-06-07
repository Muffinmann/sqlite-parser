import { createExprParser } from "./parser";

describe('parser', () => {
  // it('parse binary operation expr correctly', () => {
  //   const p = createBinaryOperationParser()
  //   const tokens = [
  //     { type: 'identifier', value: 'table2' },
  //     { type: 'punctuation', value: '.' },
  //     { type: 'identifier', value: 'col1' },
  //     { type: 'operator', value: '=' },
  //     { type: 'identifier', value: 't2' },
  //     { type: 'punctuation', value: '.' },
  //     { type: 'identifier', value: 'col2' },
  //   ]
  //   for (const t of tokens) {
  //     expect(p(t)).toMatchObject(expect.objectContaining({ matched: true }))
  //   }

  //   const p2 = createBinaryOperationParser()
  //   const tokens2 = [
  //     { type: 'identifier', value: 'table2' },
  //     { type: 'punctuation', value: '.' },
  //     { type: 'identifier', value: 'col1' },
  //     { type: 'operator', value: '=' },
  //     { type: 'literal', value: 't2' },
  //   ]
  //   for (const t of tokens2) {
  //     expect(p2(t)).toMatchObject(expect.objectContaining({ matched: true }))
  //   }
  // })

  it.only("parse expr correctly", () => {
    const p = createExprParser()
    const tokens = [
      { type: 'paren', value: '(' },
      { type: 'identifier', value: 'table2' },
      { type: 'punctuation', value: '.' },
      { type: 'identifier', value: 'col1' },
      { type: 'operator', value: '=' },
      { type: 'identifier', value: 't2' },
      { type: 'punctuation', value: '.' },
      { type: 'identifier', value: 'col2' },
      { type: 'paren', value: ')' },
      { type: 'operator', value: '=' },
      { type: 'paren', value: '(' },
      { type: 'identifier', value: 'col3' },
      { type: 'operator', value: '=' },
      { type: 'identifier', value: 'col4' },
      { type: 'paren', value: ')' },
    ]
    for (const t of tokens) {
      const res = p(t)
      console.log({ t, res })
      expect(res).toMatchObject(expect.objectContaining({ matched: true }))
    }
  })
})
