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
type SerialTokenParser = (t: Token) => { finished: boolean, value: undefined | false | {} }
export const createSerialTokenParser = (
  criteria: Array<(t: Token) => string | boolean>,
  final: ((res: (string | boolean)[]) => {}),
): SerialTokenParser => {
  let ptr = 0
  const checkResult: (string | boolean)[] = []
  let finished = false
  return (t: Token) => {
    if (ptr > criteria.length - 1) {
      if (finished) {
        return { finished, value: false }
      }
      throw new Error("Pointer out of range")
    }

    try {
      const currentResult = criteria[ptr](t)

      if (!currentResult) {
        finished = true
        return { finished, value: false }
      }

      checkResult.push(currentResult)

      if (ptr === criteria.length - 1) {
        if (!checkResult.every(Boolean)) {
          finished = true
          return {
            finished: true, value: false
          }
        }
        const finalValue = typeof final === 'function' ? final(checkResult) : final
        finished = true
        return {
          finished: true,
          value: finalValue
        }
      }

      return { finished: false, value: undefined }
    } finally {
      ptr++
    }
  }
}

export const makeReusable = (parserCreator: typeof createSerialTokenParser, trigger: { new: boolean }) => new Proxy(parserCreator, {
  apply(target, thisArg, args) {
    const create = () => Reflect.apply(target, thisArg, args)
    const parser = { current: create() }
    return (t: Token) => {
      if (trigger.new) {
        parser.current = create()
        trigger.new = false
      }
      const res = parser.current(t)
      return res
    }
  }
});

const makeRepeatable = (
  parserCreator: () => (t: Token) => { finished: boolean, value: unknown },
  config: {
    repeat: (t: Token) => boolean,
    finish: (t: Token) => boolean
  }
) => {
  let currentParser = parserCreator()
  let result: {}[] = []
  return (t: Token) => {
    if (config.finish(t)) {
      return { finished: true, value: result }
    }
    if (config.repeat(t)) {
      currentParser = parserCreator()
    }
    const temp = currentParser(t)
    if (temp.finished) {
      if (temp.value === false) { // parse failed
        return temp
      }
      result.push(temp.value as {})
    }

    return { finished: false, value: undefined }
  }
}

const makeGroup = (parsers: Array<SerialTokenParser>) => {
  const length = parsers.length
  let failCount = 0
  return (t: Token) => {
    for (let i = 0; i < parsers.length; ++i) {
      const parser = parsers[i]
      const tempResult = parser(t)
      if (tempResult.finished) {
        if (tempResult.value === false) {
          failCount++
        } else {
          return tempResult
        }
      }

    }

    if (failCount === length) {
      return { finished: true, value: false }
    }

    return { finished: false, value: undefined }
  }
}

// const groupParser = makeGroup([
//   createSerialTokenParser([tokenIs('identifier')], ([v1]) => createResultColumnNode(v1)),
//   createSerialTokenParser([tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier')], ([v1, , v3]) => createResultColumnNode(v1, v3)),
//   createSerialTokenParser([tokenIs('identifier'), tokenIs('identifier')], ([v1, v2]) => createResultColumnNode(v1, v2)),
// ])

// // const p = trackAndParse([
// //         [tokenIs('identifier'), ([v1]: any) => createResultColumnNode(v1)],
// //         [tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier'), ([v1, , v3]: any) => createResultColumnNode(v1, v3)],
// //         [tokenIs('identifier'), tokenIs('identifier'), ([v1, v2]: any) => createResultColumnNode(v1, v2)],
// //         [tokenIs('wildcard', '*'), createResultColumnNode("*")],
// //         [tokenIs('identifier'), tokenIs('punctuation', '.'), tokenIs('identifier'), ([v1, , v3]: any) => createResultColumnNode(v3, null, v1)]
// //       ], {
// //         repeat: tokenIs('punctuation', ','),
// //         finish: tokenIs('keyword', 'FROM'),
// //         onNodeParsed: (n) => { selectNode.columns.push(node) }
// //       })
// const parseResultColumn = makeRepeatable(
//   () => { },
//   {
//     repeat: tokenIs('punctuation', ','),
//     finish: tokenIs('keyword', 'FROM')
//   }
// )
export const trackAndParse = (
  tracks: [...Function[], ((args: (string | boolean)[]) => object) | object][],
  options: { repeat: () => boolean, finish: () => boolean, onNodeParsed: (n: any) => void }
) => {
  let ptr = 0
  const lengths = tracks.map(track => track.length)
  const maxLength = Math.max(...lengths)
  const trackResult = Array.from({ length: tracks.length }, () => []) as (string | boolean)[][]

  return (t: Token) => {
    for (let i = 0; i < tracks.length; ++i) {
      const track = tracks[i]

      if (ptr < track.length - 1) {
        const checkToken = track[ptr] as Function
        trackResult[i].push(checkToken(t))
      }
      if (ptr === track.length - 2) {
        const parsedNode = track[ptr + 1]
        if (trackResult[i].every(Boolean)) {
          return {
            finished: true,
            value: typeof parsedNode === 'function' ? parsedNode(trackResult[i]) : parsedNode
          }
        }
      }

    }

    ptr++
    if (ptr < maxLength - 1) {
      return { finished: false, trackResult }
    }
    throw new Error("No track matched")
  }


}



const parseToken = (tokens: Token[]) => {
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
    while (!currentTokenIs('keyword', 'FROM')) {
      if (currentTokenIs('keyword', 'DISTINCT')) {
        selectNode.distinct = true
        ptr++
        continue
      }
      if (currentTokenIs('punctuation', ',')) {
        ptr++
        continue
      }


      // result-column has three variants:
      // 1. expr [[as] column-alias]
      // 2. *
      // 3. table-name.*
      // const p = trackAndParse([
      //   [tokenIs('identifier'), ([v1]: any) => createResultColumnNode(v1)],
      //   [tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier'), ([v1, , v3]: any) => createResultColumnNode(v1, v3)],
      //   [tokenIs('identifier'), tokenIs('identifier'), ([v1, v2]: any) => createResultColumnNode(v1, v2)],
      //   [tokenIs('wildcard', '*'), createResultColumnNode("*")],
      //   [tokenIs('identifier'), tokenIs('punctuation', '.'), tokenIs('identifier'), ([v1, , v3]: any) => createResultColumnNode(v3, null, v1)]
      // ], {
      //   repeat: tokenIs('punctuation', ','),
      //   finish: tokenIs('keyword', 'FROM'),
      //   onNodeParsed: (n) => { selectNode.columns.push(node) }
      // })
      // while (!currentTokenIs('punctuation', ',')) {
      //   const res = p(token)
      //   if (res.finished) {
      //     selectNode.columns.push(res.value)
      //   }
      //   token = tokens[ptr++]
      // }
      // while (!p(token).finished) {
      //   token = tokens[++ptr]
      // }
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


export default parseToken;