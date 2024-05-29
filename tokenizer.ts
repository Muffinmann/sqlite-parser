import { KEY_WORDS, METHODS } from "./const.js"

const createWordToken = (w: string) => {
  if (w.toLocaleUpperCase() in KEY_WORDS) {
    return {
      type: 'keyword',
      value: w.toLocaleUpperCase()
    }
  }
  if (w in METHODS) {
    return {
      type: "method",
      value: w
    }
  }
  return {
    type: 'identifier',
    value: w
  }
}
const WILDCARD = /\*|\?/
const WHITESPACE = /\s/
const LINE_FEED = /\n/
const LETTER = /[a-z]/i
const DIGIT = /[0-9]/
const WORD = /\w+/i
const PARENTHESES = /[()]/
const OPERATOR = /=/
const PUNCTUATION = /[,.;]/
const SINGLE_QUOTE = /'/

const tokenize = (text: string) => {
  let ptr = 0;
  const tokens: {type: string, value: string}[] = []
  let char = text[ptr]
  const forward = () => {
    char = text[++ptr]
    return char
  }

  while (ptr < text.length) {
    // char = text[ptr]
    if (PARENTHESES.test(char)) {
      tokens.push({
        type: 'paren',
        value: char
      })
      forward()
      continue
    }

    if (WILDCARD.test(char)) {
      tokens.push({
        type: 'wildcard',
        value: char
      })
      forward()
      continue
    }

    if (PUNCTUATION.test(char)) {
      tokens.push({
        type: 'punctuation',
        value: char
      })
      forward()
      continue
    }

    if (SINGLE_QUOTE.test(char)) {
      console.log('Start parsing quote', char)
      forward()
      let literal = ''
      while(!SINGLE_QUOTE.test(char)) {
        if (ptr > text.length) {
          throw new Error('No closing quote matched')
        }
        literal += char
        forward()
      }
      tokens.push({
        type: 'literal',
        value: literal,
      })
      forward() // skip the quote
      continue
    }

    if (OPERATOR.test(char)) {
      tokens.push({
        type: 'operator',
        value: char
      })
      forward()
      continue
    }

    if (DIGIT.test(char)) {
      let number = ''
      while (DIGIT.test(char)) {
        number += char
        forward()
      }
      tokens.push({
        type: 'number',
        value: number,
      })
      continue
    }

    if (LETTER.test(char)) {
      let word = ''
      while (WORD.test(char)) {
        word += char
        forward()
      }

      tokens.push(createWordToken(word))
      continue
    }

    if (WHITESPACE.test(char) || LINE_FEED.test(char)) {
      forward()
      continue
    }
    console.log("unhandled token", char)
    forward()
  }
  return tokens
}

export default tokenize