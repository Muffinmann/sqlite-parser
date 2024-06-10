import Matcher from "./Matcher";

describe('Matcher', () => {
  it('should create trie correctly', () => {
    const tokens = [
      [{ type: 'identifier' }, { type: 'punctuation', value: '.' }, { type: 'identifier' }],
      [{ type: 'identifier' }, { type: 'identifier' }],
      [{ type: 'literal' }],
    ]
    const m = new Matcher(tokens)
    expect(m.root).toEqual({
      key: 'root',
      value: null,
      children: {
        identifier: {
          key: 'identifier', value: { type: 'identifier' }, children: {
            'punctuation-.': {
              key: 'punctuation-.',
              value: { type: 'punctuation', value: '.' },
              children: {
                'identifier': {
                  key: 'identifier',
                  value: { type: 'identifier' },
                  children: {}
                }
              }
            },
            'identifier': {
              key: 'identifier',
              value: { type: 'identifier' },
              children: {}
            }
          }
        },
        literal: { key: 'literal', value: { type: 'literal' }, children: {} }
      }
    })
  })
  it.only("should match recursive structure correctly", () => {
    const tokens = [
      [{ type: 'identifier' }, { type: 'punctuation', value: '.' }, { type: 'identifier' }],
      [{ type: 'identifier' }, { type: 'identifier' }],
      [{ type: 'literal' }],
      [{ type: 'paren', value: '(' }, { type: 'root' }, { type: 'paren', value: ')' }],
      [{ type: 'root' }, { type: 'operator', value: '=' }, { type: 'root' },],
    ]
    const m = new Matcher(tokens)
    const testTokens = [
      { type: 'paren', value: '(' },
      { type: 'literal', value: 'name1' },
      { type: 'operator', value: '=' },
      { type: 'literal', value: 'name2' },
      { type: 'paren', value: ')' },
      { type: 'operator', value: '=' },
      { type: 'paren', value: '(' },
      { type: 'identifier', value: 'col1' },
      { type: 'paren', value: ')' },
    ]
    // const testTokens = [
    //   { type: 'literal', value: 'name1' },
    //   { type: 'operator', value: '=' },
    //   { type: 'literal', value: 'name2' },
    // ]
    for (let i = 0; i < testTokens.length; ++i) {
      console.log('Matching', i + 1, '...')
      const res = m.match(testTokens[i])
      expect(res.value).not.toBeUndefined()
      // console.log('res:', res)

    }
  })
  it.only("should match recursive start correctly", () => {
        const tokens = [
      [{ type: 'identifier' }, { type: 'punctuation', value: '.' }, { type: 'identifier' }],
      [{ type: 'identifier' }, { type: 'identifier' }],
      [{ type: 'literal' }],
      [{ type: 'paren', value: '(' }, { type: 'root' }, { type: 'paren', value: ')' }],
      [{ type: 'root' }, { type: 'operator', value: '=' }, { type: 'root' },],
    ]
    const m = new Matcher(tokens)
    const testTokens = [
      { type: 'literal', value: 'name1' },
      { type: 'operator', value: '=' },
      { type: 'literal', value: 'name2' },
    ]
    for (let i = 0; i < testTokens.length; ++i) {
      console.log('Matching', i + 1, '...')
      const res = m.match(testTokens[i])
      expect(res.value).not.toBeUndefined()
      // console.log('res:', res)

    }
  })
})