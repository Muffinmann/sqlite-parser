type SelectNode = {
  type: 'SelectStatement',
  distinct: boolean,
  columns: {}[],
  from: {} | null,
  joins: {}[],
  where: {} | null,
  groupBy: {}[],
  orderBy: {}[],
  limit: number | null,
  offset: number | null
}

type Token = {
  type: string,
  value: string,
}


export const createResultColumnNode = (columnName: string, alias: string | null = null, table: string | null = null) => {
  return {
    type: "column_ref",
    column: columnName,
    alias,
    table
  }
}

export const tokenIs = (type: string, value?: string) => (t: Token) => {
  if (t.type !== type) {
    return false
  }
  if (value !== undefined) {
    return t.value === value
  }
  return t.value
}

type SerialTokenParser = (t: Token) => { matched: boolean, value: undefined | {} }

// Tries to match pre-defined criteria by calling the returned parse function.
// The final callback gets called when the whole criteria array is matched. 
// Always returns unmatched when the calls of the parse function exceed the criteria length.
export const createSerialTokenParser = (
  criteria: Array<(t: Token) => string | boolean>,
  final: {} | ((res: (string | boolean)[]) => {}),
): SerialTokenParser => {
  let ptr = 0
  const checkResult: (string | boolean)[] = []
  let lastMatched: boolean
  return (t: Token) => {
    if (ptr > criteria.length - 1 || (lastMatched === false)) {
      return { matched: false, value: undefined }
    }

    try {
      const currentResult = criteria[ptr](t)

      if (!currentResult) {
        lastMatched = false
        return { matched: false, value: undefined }
      }

      checkResult.push(currentResult)

      if (ptr === criteria.length - 1) {
        const finalValue = typeof final === 'function' ? final(checkResult) : final
        return {
          matched: true,
          value: finalValue
        }
      }

      return { matched: true, value: ptr }
    } finally {
      ptr++
    }
  }
}

const tokenIsExpr = (prev: Token) => (t: Token) => {
  if (tokenIs('literal')(t)) {
    return { matched: true, value: t.value }
  }
  if (tokenIs('operator', '=')) {

  }
  return tokenIsExpr(t)
}



export const makeReusable = (parserCreator: typeof createSerialTokenParser, trigger: { new: number }) => new Proxy(parserCreator, {
  apply(target, thisArg, args) {
    const create = () => Reflect.apply(target, thisArg, args)
    const parser = { current: create() }
    let lastTrigger: number
    return (t: Token) => {
      if (trigger.new !== lastTrigger) {
        parser.current = create()
        lastTrigger = trigger.new
      }
      const res = parser.current(t)
      return res
    }
  }
});

// const makeRepeatable = (
//   parserCreator: () => (t: Token) => { finished: boolean, value: unknown },
//   config: {
//     repeat: (t: Token) => boolean,
//     finish: (t: Token) => boolean
//   }
// ) => {
//   let currentParser = parserCreator()
//   let result: {}[] = []
//   return (t: Token) => {
//     if (config.finish(t)) {
//       return { finished: true, value: result }
//     }
//     if (config.repeat(t)) {
//       currentParser = parserCreator()
//     }
//     const temp = currentParser(t)
//     if (temp.finished) {
//       if (temp.value === false) { // parse failed
//         return temp
//       }
//       result.push(temp.value as {})
//     }

//     return { finished: false, value: undefined }
//   }
// }

export const makeGroup = (parsers: Array<SerialTokenParser>) => {
  return (t: Token) => {
    let successResult
    for (let i = 0; i < parsers.length; ++i) {
      const parser = parsers[i]
      const currentResult = parser(t)
      if (currentResult.matched && successResult === undefined) {
        successResult = currentResult
      }
    }

    if (successResult) {
      return successResult
    }

    return {
      matched: false, value: undefined
    }

  }
}

// const createRecursiveParser = (prevCriteria, currentCriteria, final) => {
//   const recursiveParse = (prev) => {
//     if (prev.matched) {
//       return recursiveParse(currentCriteria)
//     }
//     if (recursiveCriteria()) {
//       return recursiveParse()
//     }
//   }
//   return (t: Token) => {

//   }
// }

export const makeGroupV2 = (parsers: Array<SeriesTokenParser>) => {
  let availableParsers = [...parsers]
  return (t: Token) => {
    let successResult
    let matchCount = 0
    let finishCount = 0
    let matchFailed = []
    for (let i = 0; i < availableParsers.length; ++i) {
      const parser = availableParsers[i]
      const currentResult = parser(t)

      if (currentResult.finished) {
        finishCount++
      }
      if (currentResult.matched) {
        matchCount++
        // if (currentResult.finished && successResult === undefined) {
        successResult = currentResult
        // }
      } else {
        matchFailed.push(i)
      }
    }
    availableParsers = availableParsers.filter((_, index) => matchFailed.includes(index))
    // console.log({ t, successResult, matchCount, finishCount })
    // consider a group of 2 parsers, after evaluate each parser, there are several possible cases
    // 1. one is matched and finished while:
    // 1.1 the other is not matched but finished (parser finishes as soon as it is not matched)
    // 1.2 the other is matched but not finished
    // 1.3 the other is matched and finished 

    if (successResult) {
      return {
        ...successResult,
        finished: finishCount === availableParsers.length
      }
      // return successResult
    }

    // if (matchCount > 0) {
    //   return {
    //     matched: true,
    //     finished: false,
    //     value: undefined,
    //   }
    // }

    return {
      matched: false, finished: true, value: undefined
    }

  }
}

// -> literal-value ->
// -> column-name ->
// -> table-name -> . -> column-name ->
// -> expr -> binary-operator -> expr ->
//
// (column-name) -> binary-operator -> ((column-name -> binary-operator -> column-name) -> binary-operator -> column-name)
// (column-name) -> binary-operator -> (literal-value)
// (column-name) -> binary-operator -> (COLLATE -> collation-name)
// const createBaseExprParser = (resetTrigger: { new: number }) => {
//   const createParser = makeReusable(createSerialTokenParser, resetTrigger)
//   const parseBaseExpr = makeGroup([
//     createParser([tokenIs('literal')], ([v1]: any) => ({ type: 'literal-value', v1 })),
//     createParser([tokenIs('identifier'), tokenIs('punctuation', '.'), tokenIs('identifier')], ([v1, , v3]: any) => ({ type: 'column-ref', v1, v3 })),
//     createParser([tokenIs('identifier')], ([v1]: any) => ({ type: 'column-ref', v1 })),
//   ])
//   return parseBaseExpr
// }

// export const createBinaryOperationParser = () => {
//   const resetTrigger = { new: 0 }
//   const baseExprParser = createBaseExprParser(resetTrigger)
//   const binaryOperatorParser = makeReusable(createSerialTokenParser, resetTrigger)([
//     tokenIs('operator', '=')
//   ], ([v1]: any) => ({ type: 'binary-operator', v1 }))

//   return (t: Token) => {
//     const baseExprPartResult = baseExprParser(t)
//     if (baseExprPartResult.matched) {
//       return baseExprPartResult
//     }
//     // not match. check if it is binary operator
//     const result = binaryOperatorParser(t)
//     if (result.matched) {
//       resetTrigger.new++ // reset the baseExprParser
//     }
//     return result
//   }
// }
type SeriesTokenParser = (t: Token) => { value: string | boolean | undefined, matched: boolean, finished: boolean }
const createSeriesParser = (criteria: Array<(t: Token) => { value: string | boolean | undefined, matched: boolean, finished: boolean }>, final: Function) => {
  // const parser = []
  let ptr = 0
  // let lastFinished = false
  // const parser = { current: parse }
  let finalResult: unknown[] = []
  let matchFailed = false
  function parse(t: Token) {
    if (ptr > criteria.length - 1 || matchFailed) {
      // throw new Error("Pointer out of range")
      return {
        finished: true,
        matched: false,
        value: undefined
      }
    }

    const currentParser = criteria[ptr]

    const res = currentParser(t)
    console.log({ ptr, t, res, finalResult })
    if (res.matched) {
      finalResult.push(res.value)
    } else {
      matchFailed = true
    }
    if (res.finished) {
      if (ptr === criteria.length - 1) {
        final(finalResult)
      }
      ptr++
    }

    return res
  }

  return parse
}

const wrapFinished = (fn: (t: Token) => string | boolean) => {
  return (t: Token) => ({
    value: fn(t),
    matched: Boolean(fn(t)),
    finished: true
  })
}

const createBaseExprParser = () => {
  const p = makeGroupV2([
    createSeriesParser([wrapFinished(tokenIs('literal'))], () => ({})),
    createSeriesParser([wrapFinished(tokenIs('identifier'))], () => ({})),
    createSeriesParser([wrapFinished(tokenIs('identifier')), wrapFinished(tokenIs('punctuation', '.')), wrapFinished(tokenIs('identifier'))], () => ({})),
    createSeriesParser([wrapFinished(tokenIs('paren', '(')), createExprParser(), wrapFinished(tokenIs('paren', ')'))], () => ({})),
  ])
  return p
  // return (t: Token) => {
  //   const res = p(t)
  //   console.log('base expr parser', { t, res })
  //   return res
  // }

}

export const createExprParser = (p?: ReturnType<typeof makeGroupV2>) => {
  // let parseBaseExpr: ReturnType<typeof makeGroupV2>
  let parseExpr: ReturnType<typeof makeGroupV2> | undefined = p
  let lastBaseResult: ReturnType<SeriesTokenParser>
  return (t: Token) => {
    if (!parseExpr) {
      parseExpr = makeGroupV2([
        createSeriesParser([wrapFinished(tokenIs('literal'))], () => ({})),
        createSeriesParser([wrapFinished(tokenIs('identifier'))], () => ({})),
        createSeriesParser([wrapFinished(tokenIs('identifier')), wrapFinished(tokenIs('punctuation', '.')), wrapFinished(tokenIs('identifier'))], () => ({})),
        createSeriesParser([createBaseExprParser(), wrapFinished(tokenIs('operator', '=')), createExprParser()], () => ({})),
        createSeriesParser([wrapFinished(tokenIs('paren', '(')), createExprParser(), wrapFinished(tokenIs('paren', ')'))], () => ({})),
      ])
    }
    const res = parseExpr(t)
    if (res) { }
    return res
    // if (!parseBaseExpr) {
    //   parseBaseExpr = makeGroupV2([
    //     createSeriesParser([wrapFinished(tokenIs('literal'))], () => ({})),
    //     createSeriesParser([wrapFinished(tokenIs('identifier'))], () => ({})),
    //     createSeriesParser([wrapFinished(tokenIs('identifier')), wrapFinished(tokenIs('punctuation', '.')), wrapFinished(tokenIs('identifier'))], () => ({})),
    //   ])
    // }
    // const baseResult = parseBaseExpr(t)
    // if (baseResult.matched) {
    //   lastBaseResult = baseResult
    //   return baseResult
    // }

    // base not matched, check if it comes to the recursive part
    // if (lastBaseResult) {

    //   if (!parseExpr) {
    //     parseExpr = makeGroupV2([
    //       createSeriesParser([wrapFinished(tokenIs('operator', '=')), createExprParser()], () => ({})),
    //       createSeriesParser([wrapFinished(tokenIs('paren', '(')), createExprParser(), wrapFinished(tokenIs('paren', ')'))], () => ({})),
    //     ])
    //   }

    //   const exprResult = parseExpr(t)
    //   console.log({
    //     exprResult
    //   })
    //   return exprResult
  }


}


// result-column has three variants:
// 1. expr [[as] column-alias]
// 2. *
// 3. table-name.*
// here the expr part is simplified.
const createResultColumnParser = (onNodeParsed: (node: {}) => void) => {
  const trigger = { new: 0 }
  const createParser = makeReusable(createSerialTokenParser, trigger)
  const parseResultColumn = makeGroup([
    createParser([tokenIs('identifier')], ([v1]: any) => createResultColumnNode(v1)),
    createParser([tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier')], ([v1, , v3]: any) => createResultColumnNode(v1, v3)),
    createParser([tokenIs('identifier'), tokenIs('identifier')], ([v1, v2]: any) => createResultColumnNode(v1, v2)),
    createParser([tokenIs('wildcard', '*')], createResultColumnNode("*")),
    createParser([tokenIs('identifier'), tokenIs('punctuation', '.'), tokenIs('identifier')], ([v1, , v3]: any) => createResultColumnNode(v3, null, v1))
  ])
  let result: {} | undefined
  let lastMatched = false
  return (t: Token) => {
    if (tokenIs('punctuation', ',')(t)) {
      trigger.new++
      if (result) {
        onNodeParsed(result)
        // reset flags
        result = undefined
        lastMatched = false
      }
    }
    const res = parseResultColumn(t)
    if (res.matched) {
      result = res.value
      lastMatched = true
    } else if (lastMatched && result) {
      onNodeParsed(result)
    }
    return res
  }
}

const createFromParser = (onNodeParsed: (n: {}) => void) => {
  let start = false
  return (t: Token) => {
    if (!start) {
      if (tokenIs('keyword', 'FROM')(t)) {
        start = true
        return { matched: true, value: 'FROM' }
      }
      return { matched: false, value: undefined }
    }
    // parsing token

  }
}

const parse = (tokens: Token[]) => {
  let ptr = 0
  let ast = {
    type: 'program',
    body: []
  } as any

  const currentTokenIs = (type: string, value: string) => {
    const token = tokens[ptr];
    return token && token.type === type && token.value === value;
  }

  const parseSelect = () => {
    const selectNode: SelectNode = {
      type: 'SelectStatement',
      distinct: false,
      columns: [],
      from: null,
      joins: [],
      where: null,
      groupBy: [],
      orderBy: [],
      limit: null,
      offset: null
    };

    let token = tokens[ptr]
    const parseResultColumn = createResultColumnParser((n) => { selectNode.columns.push(n) })
    const parseFrom = createFromParser((n) => { selectNode.from = n })

    if (currentTokenIs('keyword', 'DISTINCT')) {
      selectNode.distinct = true
      ptr++
    }

    while (parseResultColumn(token).matched) {
      token = tokens[++ptr]
    }

    if (currentTokenIs('keyword', 'FROM')) {
      // const p = trackAndParse([
      //   []
      // ])
    }

    return selectNode
  }
  const parseUpdate = () => { }
  const parseInsert = () => { }

  while (ptr < tokens.length) {
    let token = tokens[ptr]
    if (token.type === 'keyword' && token.value === 'SELECT') {
      ptr++ // skip select key word
      ast.body.push(parseSelect())
      continue
    }
    if (token.type === 'keyword' && token.value === 'UPDATE') {
      ast.body.push(parseUpdate())
      continue
    }
    if (token.type === 'keyword' && token.value === 'INSERT') {
      ast.body.push(parseInsert())
      continue
    }
    throw new Error('unhandled token' + token.value)
  }

  return ast
}


export default parse;