import parse, { createResultColumnNode, createSerialTokenParser, makeGroup, makeReusable, tokenIs } from "./parser.js";
import tokenize from "./tokenizer.js"

const testQuery = `
SELECT * FROM users WHERE user_id =?1;
`
console.log(tokenize(testQuery))

const testSql = `SELECT column1 as c1, column2 c2 FROM table1 t1 LEFT JOIN table2 t2 ON t1.id = t2.id WHERE c1 = 'value1' ORDER BY c1 ASC LIMIT 10 OFFSET 20`;
console.log(tokenize(testSql))
// console.log(JSON.stringify(parse(tokenize(testSql)), null, 2))


const test1 = `
SELECT *
     FROM anamneses a
     LEFT JOIN users u ON a.anamneses_created_by = u.users_user_id
     LEFT JOIN departments d ON e.employees_department_id = d.departments_department_id
     WHERE (a.anamneses_status = ?3 OR ?3 IS NULL)
       AND (a.anamneses_created_by = ?4 OR ?4 IS NULL)
       AND (a.anamneses_customer_id = ?5 OR ?5 IS NULL)
     GROUP BY a.anamneses_anamnesis_id
     ORDER BY a.anamneses_date DESC, a.anamneses_created_at DESC
     LIMIT ?1
     OFFSET ?2
`


console.log(test1)
console.log(tokenize(test1))


const p = createSerialTokenParser(
  [
    tokenIs('identifier'),
    tokenIs('punctuation', '.'),
    tokenIs('wildcard', '*')
  ], (([v1, , v3]) => ({ v1, v3 }))
)

const trigger = { new: 0 } // TODO (t: Token) => boolean
const reusableP = makeReusable(createSerialTokenParser, trigger)(
  [
    tokenIs('identifier'),
    tokenIs('punctuation', '.'),
    tokenIs('wildcard', '*')
  ], (([v1, , v3]: any) => ({ v1, v3 })
))

try {
  console.log(p({ type: 'identifier', value: 'table1' }))
  console.log(p({ type: 'punctuation', value: '.' }))
  console.log(p({ type: 'wildcard', value: '*' }))
  console.log(p({ type: 'identifier', value: 'table1' }))
  console.log(p({ type: 'punctuation', value: '.' }))
  console.log(p({ type: 'wildcard', value: '*' }))
  console.log(p({ type: 'keyword', value: 'FROM' }))
  console.log(p({ type: 'keyword', value: 'FROM' }))
} catch (e) {
  console.log(e)
}

console.log("reusable")
console.log(reusableP({ type: 'identifier', value: 'table1' }))
console.log(reusableP({ type: 'punctuation', value: '.' }))
console.log(reusableP({ type: 'wildcard', value: '*' }))
console.log(reusableP({ type: 'keyword', value: 'FROM' }))
console.log(reusableP({ type: 'keyword', value: 'FROM' }))
trigger.new++
console.log(reusableP({ type: 'identifier', value: 'table1' }))
console.log(reusableP({ type: 'punctuation', value: '.' }))
console.log(reusableP({ type: 'wildcard', value: '*' }))
console.log(reusableP({ type: 'keyword', value: 'FROM' }))
console.log(reusableP({ type: 'keyword', value: 'FROM' }))

const groupParser = makeGroup([
  createSerialTokenParser([tokenIs('identifier')], ([v1]) => ({ v1 })),
  createSerialTokenParser([tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier')], ([v1, , v3]) => ({ v1, v3 })),
  createSerialTokenParser([tokenIs('identifier'), tokenIs('identifier')], ([v1, v2]) => ({ v1, v2 })),
])
console.log('group parser')
console.log(groupParser({ type: 'identifier', value: 'table1' }))
console.log(groupParser({ type: 'keyword', value: 'AS' }))
console.log(groupParser({ type: 'identifier', value: 't1' }))
console.log(groupParser({ type: 'identifier', value: 'table1' }))
console.log(groupParser({ type: 'keyword', value: 'AS' }))
console.log(groupParser({ type: 'identifier', value: 't1' }))
console.log(groupParser({ type: 'keyword', value: 'FROM' }))
console.log(groupParser({ type: 'keyword', value: 'FROM' }))


const resetTrigger = { new: 0 }
const reusableParser = makeReusable(createSerialTokenParser, resetTrigger)
const reusableGroupParser = makeGroup([
  reusableParser([tokenIs('identifier')], ([v1]) => ({ v1 })),
  reusableParser([tokenIs('identifier'), tokenIs('keyword', 'AS'), tokenIs('identifier')], ([v1, , v3]) => ({ v1, v3 })),
  reusableParser([tokenIs('identifier'), tokenIs('identifier')], ([v1, v2]) => ({ v1, v2 })),
])

console.log('reusable group parser')
console.log(reusableGroupParser({ type: 'identifier', value: 'table1' }))
console.log(reusableGroupParser({ type: 'keyword', value: 'AS' }))
console.log(reusableGroupParser({ type: 'identifier', value: 't1' }))
resetTrigger.new++
console.log(reusableGroupParser({ type: 'identifier', value: 'table1' }))
console.log(reusableGroupParser({ type: 'keyword', value: 'AS' }))
console.log(reusableGroupParser({ type: 'identifier', value: 't1' }))
console.log(reusableGroupParser({ type: 'keyword', value: 'FROM' }))
console.log(reusableGroupParser({ type: 'keyword', value: 'FROM' }))

