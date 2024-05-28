enum KEY_WORDS {
  ABORT = 'abort',
  ACTION = 'action',
  ADD = 'add',
  AFTER = 'after',
  ALL = 'all',
  ALTER = 'alter',
  ALWAYS = 'always',
  ANALYZE = 'analyze',
  AND = 'and',
  AS = 'as',
  ASC = 'asc',
  ATTACH = 'attach',
  AUTOINCREMENT = 'autoincrement',
  BEFORE = 'before',
  BEGIN = 'begin',
  BETWEEN = 'between',
  BY = 'by',
  CASCADE = 'cascade',
  CASE = 'case',
  CAST = 'cast',
  CHECK = 'check',
  COLLATE = 'collate',
  COLUMN = 'column',
  COMMIT = 'commit',
  CONFLICT = 'conflict',
  CONSTRAINT = 'constraint',
  CREATE = 'create',
  CROSS = 'cross',
  CURRENT = 'current',
  CURRENT_DATE = 'current_date',
  CURRENT_TIME = 'current_time',
  CURRENT_TIMESTAMP = 'current_timestamp',
  DATABASE = 'database',
  DEFAULT = 'default',
  DEFERRABLE = 'deferrable',
  DEFERRED = 'deferred',
  DELETE = 'delete',
  DESC = 'desc',
  DETACH = 'detach',
  DISTINCT = 'distinct',
  DO = 'do',
  DROP = 'drop',
  EACH = 'each',
  ELSE = 'else',
  END = 'end',
  ESCAPE = 'escape',
  EXCEPT = 'except',
  EXCLUDE = 'exclude',
  EXCLUSIVE = 'exclusive',
  EXISTS = 'exists',
  EXPLAIN = 'explain',
  FAIL = 'fail',
  FILTER = 'filter',
  FIRST = 'first',
  FOLLOWING = 'following',
  FOR = 'for',
  FOREIGN = 'foreign',
  FROM = 'from',
  FULL = 'full',
  GENERATED = 'generated',
  GLOB = 'glob',
  GROUP = 'group',
  GROUPS = 'groups',
  HAVING = 'having',
  IF = 'if',
  IGNORE = 'ignore',
  IMMEDIATE = 'immediate',
  IN = 'in',
  INDEX = 'index',
  INDEXED = 'indexed',
  INITIALLY = 'initially',
  INNER = 'inner',
  INSERT = 'insert',
  INSTEAD = 'instead',
  INTERSECT = 'intersect',
  INTO = 'into',
  IS = 'is',
  ISNULL = 'isnull',
  JOIN = 'join',
  KEY = 'key',
  LAST = 'last',
  LEFT = 'left',
  LIKE = 'like',
  LIMIT = 'limit',
  MATCH = 'match',
  MATERIALIZED = 'materialized',
  NATURAL = 'natural',
  NO = 'no',
  NOT = 'not',
  NOTHING = 'nothing',
  NOTNULL = 'notnull',
  NULL = 'null',
  NULLS = 'nulls',
  OF = 'of',
  OFFSET = 'offset',
  ON = 'on',
  OR = 'or',
  ORDER = 'order',
  OTHERS = 'others',
  OUTER = 'outer',
  OVER = 'over',
  PARTITION = 'partition',
  PLAN = 'plan',
  PRAGMA = 'pragma',
  PRECEDING = 'preceding',
  PRIMARY = 'primary',
  QUERY = 'query',
  RAISE = 'raise',
  RANGE = 'range',
  RECURSIVE = 'recursive',
  REFERENCES = 'references',
  REGEXP = 'regexp',
  REINDEX = 'reindex',
  RELEASE = 'release',
  RENAME = 'rename',
  REPLACE = 'replace',
  RESTRICT = 'restrict',
  RETURNING = 'returning',
  RIGHT = 'right',
  ROLLBACK = 'rollback',
  ROW = 'row',
  ROWS = 'rows',
  SAVEPOINT = 'savepoint',
  SELECT = 'select',
  SET = 'set',
  TABLE = 'table',
  TEMP = 'temp',
  TEMPORARY = 'temporary',
  THEN = 'then',
  TIES = 'ties',
  TO = 'to',
  TRANSACTION = 'transaction',
  TRIGGER = 'trigger',
  UNBOUNDED = 'unbounded',
  UNION = 'union',
  UNIQUE = 'unique',
  UPDATE = 'update',
  USING = 'using',
  VACUUM = 'vacuum',
  VALUES = 'values',
  VIEW = 'view',
  VIRTUAL = 'virtual',
  WHEN = 'when',
  WHERE = 'where',
  WINDOW = 'window',
  WITH = 'with',
  WITHOUT = 'without'
}

enum METHODS {
  CREATE = 'create'
}


const createWordToken = (w: string) => {
  if (w in KEY_WORDS) {
    return {
      type: 'keyword',
      value: w
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
const EQUAL = /=/
const PUNCTUATION = /[,.'";]/

const tokenize = (text: string) => {
  let ptr = 0;
  const tokens: {}[] = []
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

    if (EQUAL.test(char)) {
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