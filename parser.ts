type SelectNode = {
  type: 'SelectStatement',
  distinct: boolean,
  columns: {}[],
  from: {} | null,
  joins: {}[] ,
  where: {}| null,
  groupBy: {}[],
  orderBy: {}[],
  limit: number | null,
  offset: number | null
}

const parseToken = (tokens: {type: string, value: string}[]) => {
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
      joins: [] ,
      where: null,
      groupBy: [],
      orderBy: [],
      limit: null,
      offset: null
    } ;
    
    let token = tokens[ptr]
    while(token.type !== 'keyword' && token.value !== 'FROM') {
      if (currentTokenIs('keyword', 'DISTINCT')) {
        selectNode.distinct = true
        ptr++
        continue
      }

      let resultColumn = {
        type: null,
        stack: []
      }
      // reesult-column has three variants:
      // 1. expr (as column-alias)
      // 2. *
      // 3. table-name.*
      while (!currentTokenIs('punctuation', ',')) {
        if (currentTokenIs('wildcard', '*')) {
          selectNode.columns.push({
            type: 'column_ref',
            column: '*'
          }) 
          ptr++
          continue
        }
        token = tokens[ptr++]
      }
    }

    return selectNode
  }
  const parseUpdate = () => {}
  const parseInsert = () => {}

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
    throw new Error('unhandled token'+token.value)
  }

  return ast
}


export default parseToken;