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
  console.log(...args)
}

class Matcher {
  tokenTrie: TrieNode = { key: 'root', value: null, children: {} }
  walkNode = this.tokenTrie
  pathStack: TrieNode[][] = [[]]
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

  getLastWalkable() {
    for (let i = this.pathStack.length - 1; i>-1; --i) {
      const entries = this.pathStack[i]
      const last = entries[entries.length - 1]
      if (last && Object.keys(last.children).length) {
        return last
      }
    }
  }


  logState(title: string) {
    log(
      '------',title,'------', '\n',
    "current walk node: ", this.walkNode.key, '\n',
    "available children: ", Object.keys(this.walkNode.children), '\n',
    "current path stack: ", this.pathStack.map((entry) => entry.map((e) => e?.key || e)), '\n',
    // "raw path stack: ", JSON.stringify(this.pathStack, null, 2), '\n'
    )
  }
  match(t: Token): MatchResult {
    const key = this.makeTokenKey(t)

    this.logState(`try to match key: ${key}`)
    // initialize an entry if there is not any
    if (this.pathStack.length === 0) {
      this.pathStack.push([])
    }

    // in case no value is specified in the given token set, then only match the type
    if ((key in this.walkNode.children) || (t.type in this.walkNode.children)) {
      const nodeKey = key in this.walkNode.children ? key : t.type
      const toNode = this.walkNode.children[nodeKey]
      this.walkNode = toNode
      this.updateCurrentPath(this.walkNode)
      this.logState('key matched')
      const marker = { matchKey: nodeKey, value: t }

      // if any recursion is active
      if (this.pathStack.length > 1) {
        const lastWalkable = this.getLastWalkable()
        if (!lastWalkable) {
          return {
            finished: true,
            value: marker
          }
        }
        
        this.walkNode = lastWalkable
        this.logState('update walk node to last walkable')

        if(key in lastWalkable.children || t.type in lastWalkable.children) {
          // clear stack until last walkable
          let currentPath = this.getCurrentPath()
          let currentLast = currentPath[currentPath.length - 1]
          while(currentLast !== lastWalkable) {
            this.pathStack.pop()
            currentPath = this.getCurrentPath()
            currentLast = currentPath[currentPath.length - 1]
          }
          // this.updateCurrentPath(toNode)
          // this.walkNode = toNode
          // log('Recursive mathching after stack pop...')
          this.logState('After stack pop')
          return this.match(t)
        }

      }
      return {
        finished: false,
        value: marker
      }
    }

    // when the first token in the token set is recursive (key is 'root'), skip it and check its direct descent children instead.
    // Otherwise it can cause an infinite recursion.
    const existRecursiveStart = 'root' in this.tokenTrie.children
    const currentPath = this.getCurrentPath()
    // a recursive node at the start only valid when the current path length in not zero.
    if (existRecursiveStart && currentPath.length) {
      const availableNodes = this.tokenTrie.children.root.children
      if (key in availableNodes || t.type in availableNodes) {
        this.walkNode = this.tokenTrie.children.root
        this.logState('start recursive')
        return this.match(t)
      }
    }

    if ('root' in this.walkNode.children) {
      this.updateCurrentPath(this.walkNode.children.root)
      // create a new path entry for the recursion
      this.pathStack.push([])
      this.walkNode = this.tokenTrie
      this.logState('start recursive from ROOT')
      return this.match(t)
    }

    // check other endings of a recursive node
    if ('root' === this.walkNode.key) {
      const otherAvailableNodes = this.tokenTrie.children.root.children
      const tokenIsInOtherAvailableNodes = key in otherAvailableNodes || t.type in otherAvailableNodes
      if (tokenIsInOtherAvailableNodes) {
        this.pathStack.push([])
        this.walkNode = this.tokenTrie.children.root
        this.logState('start recursive from ORTHER root')
        return this.match(t)
      }
    }

    return {
      finished: true,
      value: undefined,
    }
  }
  reset() {
    this.walkNode = this.tokenTrie
  }

  updateCurrentPath(node: TrieNode) {
    const current = this.getCurrentPath()
    current.push(node)
  }
  getCurrentPath() {
    return this.pathStack[this.pathStack.length - 1]
  }


  private makeTokenKey(t: Token) {
    return t.value ? t.type.concat('-', t.value) : t.type
  }
  get root() {
    return this.tokenTrie
  }
}

export default Matcher