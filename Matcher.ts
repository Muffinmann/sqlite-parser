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


  match(t: Token): MatchResult {
    const key = this.makeTokenKey(t)

    // initialize an entry if there is not any
    if (this.pathStack.length === 0) {
      this.pathStack.push([])
    }

    // in case no value is specified in the given token set, then only match the type
    if ((key in this.walkNode.children) || (t.type in this.walkNode.children)) {
      log('Match key: ', { t, available: Object.keys(this.walkNode.children) })
      const nodeKey = key in this.walkNode.children ? key : t.type
      const toNode = this.walkNode.children[nodeKey]
      this.walkNode = toNode
      this.updateCurrentPath(this.walkNode)
      const marker = { matchKey: nodeKey, value: t }
      log('check available: ', Object.keys(this.walkNode.children))
      if (Object.keys(this.walkNode.children).length === 0) {
        log("before pop entry in path stack", this.pathStack.map((entry) => entry.map((e) => e.key)))
        const finished = []
        const p = this.pathStack.pop()
        finished.unshift(p)
        // exit any finished recursion
        while (this.pathStack.length) {
          const current = this.getCurrentPath()
          const last = current[current.length - 1]
          const first = current[0]
          // TODO better strategy to pop the stack entry
          // maybe set pointer this.walkNode back to last entry
          if (last.key === 'root' && first.key === 'root') {
            const lastP = this.pathStack.pop()
            finished.unshift(lastP)
          } else {
            break
          }

        }
        log("left path stack", this.pathStack.map((entry) => entry.map((e) => e.key)))
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

    log('path stack: ', this.pathStack.map((entry) => entry.map((e) => e.key)))
    // when the first token in the token set is recursive (key is 'root'), skip it and check its direct descent children instead.
    // Otherwise it can cause an infinite recursion.
    const p = this.getCurrentPath()
    const existRecursiveStart = p.length === 0 && 'root' in this.tokenTrie.children
    if (existRecursiveStart) {
      const availableNodes = this.tokenTrie.children.root.children
      if (key in availableNodes || t.type in availableNodes) {
        log('Match recursive start: ', { t, available: Object.keys(this.walkNode.children) })
        this.walkNode = this.tokenTrie.children.root
        p.push(this.tokenTrie.children.root)
        return this.match(t)
      }
    }

    if ('root' in this.walkNode.children) {
      log('Match root: ', {
        t,
        available: Object.keys(this.walkNode.children),
        pathStack: this.pathStack
      })
      this.updateCurrentPath(this.walkNode.children.root)
      // create a new path entry for the recursion
      this.pathStack.push([])
      this.walkNode = this.tokenTrie
      return this.match(t)
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