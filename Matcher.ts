interface Token {
  type: string,
  value?: string,
}

interface TrieNode {
  key: string
  value: Token | null
  children: Record<string, TrieNode>
}
const log: typeof console.log = (...args) => {
  console.log(...args)
}

class Matcher {
  tokenTrie: TrieNode = { key: 'root', value: null, children: {} }
  walkNode = this.tokenTrie
  path: Token[] = []
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

  recursiveMatch(t: Token): TrieNode {
    try {
      return this.match(t)
    } catch (e) {
      if ('root' in this.walkNode.children) {
        const recursiveNode = this.walkNode.children.root
        this.remaining.push(recursiveNode)
        this.walkNode = this.tokenTrie
        return this.recursiveMatch(t)
      }

      if (this.remaining.length) {
        const key = this.makeTokenKey(t)
        const lastRemaining = this.remaining.shift() as TrieNode
        this.walkNode = lastRemaining
        return this.recursiveMatch(t)
      }
      throw new Error(`Expecting: [${Object.keys(this.walkNode.children).toString()}], get: ${this.makeTokenKey(t)}`)
    }
  }
  match(t: Token): TrieNode {
    const key = this.makeTokenKey(t)
    if (key in this.walkNode.children) {
      const toNode = this.walkNode.children[key]
      this.path.push(t)
      this.walkNode = toNode
      return toNode
    }
    if (t.type in this.walkNode.children) {
      const toNode = this.walkNode.children[t.type]
      this.path.push(t)
      this.walkNode = toNode
      return toNode
    }
    if ('root' in this.walkNode.children) {
      const recursiveNode = this.walkNode.children.root
      this.remaining.push(recursiveNode)
      this.walkNode = this.tokenTrie
      return this.match(t)
    }

    if (this.remaining.length) {
      const key = this.makeTokenKey(t)
      const lastRemaining = this.remaining.shift() as TrieNode
      this.walkNode = lastRemaining
      return this.match(t)
    }

    throw new Error(`Expecting: [${Object.keys(this.walkNode.children).toString()}], get`)
  }
  reset() {
    this.walkNode = this.tokenTrie
  }

  makeTokenKey(t: Token) {
    return t.value ? t.type.concat('-', t.value) : t.type
  }
  get root() {
    return this.tokenTrie
  }
}

export default Matcher