export interface Token {
  type: string,
  value?: string,
}

interface TrieNode {
  key: string
  value: Token | null
  children: Record<string, TrieNode>
}

export interface MatcherMark {
  matchKey: string,
  value: Token
}

interface MatchResult {
  finished: boolean,
  value: MatcherMark | undefined
}

const log: typeof console.log = (...args) => {
  // console.log(...args)
}

class Matcher {
  tokenTrie: TrieNode = { key: 'root', value: null, children: {} }
  walkNode = this.tokenTrie
  path: TrieNode[] = []
  remaining: TrieNode[] = []

  constructor(tokenSets: Token[][]) {
    for (let i = 0; i < tokenSets.length; ++i) {
      const tokenSet = tokenSets[i]
      this.addToTrie(tokenSet)
    }
  }

  private addToTrie(tokens: Token[]) {
    let currentNode = this.tokenTrie
    for (let i = 0; i < tokens.length; ++i) {
      const token = tokens[i]
      const key = this.makeTokenKey(token)
      const childOfKey = Object.keys(currentNode.children).find((c) => c === key)
      if (childOfKey) {
        currentNode = currentNode.children[childOfKey]
        continue
      }
      const nextNode = {
        key,
        value: token,
        children: {}
      }
      currentNode.children[key] = nextNode
      currentNode = nextNode
    }
  }


  match(t: Token): MatchResult {
    const key = this.makeTokenKey(t)

    // in case no value is specified in the given token set, then only match the type
    if ((key in this.walkNode.children) || (t.type in this.walkNode.children)) {
      log('Match key: ', { t, available: Object.keys(this.walkNode.children) })
      const nodeKey = key in this.walkNode.children ? key : t.type
      const toNode = this.walkNode.children[nodeKey]
      this.path.push(toNode)
      this.walkNode = toNode
      const marker = { matchKey: nodeKey, value: t }
      if (Object.keys(this.walkNode.children).length === 0) {
        return {
          finished: true,
          value: marker
        }
      }
      return {
        finished: false,
        value: marker
      }
    }

    if ('root' in this.walkNode.children) {
      log('Match root: ', { t, available: Object.keys(this.walkNode.children) })
      const recursiveNode = this.walkNode.children.root
      this.remaining.push(recursiveNode)
      this.walkNode = this.tokenTrie
      return this.match(t)
    }


    // when the first token in the token set is recursive
    const existRecursiveStart = this.path.length && 'root' in this.tokenTrie.children
    if (existRecursiveStart) {
      const availableNodes = this.tokenTrie.children.root.children
      if (key in availableNodes || t.type in availableNodes) {
        log('Match recursive start: ', { t, available: Object.keys(this.walkNode.children) })
        this.walkNode = this.tokenTrie.children.root
        return this.match(t)
      }
    }

    if (this.remaining.length) {
      log('Match remaining: ', { t, available: Object.keys(this.walkNode.children) })
      const lastRemaining = this.remaining.shift() as TrieNode
      this.walkNode = lastRemaining
      return this.match(t)
    }
    // throw new Error(`Expecting: [${Object.keys(this.walkNode.children).toString()}], get`)
    return {
      finished: true,
      value: undefined,
    }
  }
  reset() {
    this.walkNode = this.tokenTrie
  }

  private makeTokenKey(t: Token) {
    return t.value ? t.type.concat('-', t.value) : t.type
  }
  get root() {
    return this.tokenTrie
  }
}

export default Matcher