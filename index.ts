import tokenize from "./tokenizer"

const testQuery = `
SELECT * FROM users WHERE user_id =?1;
`
console.log(tokenize(testQuery))

const testSql = `SELECT column1, column2 FROM table1 LEFT JOIN table2 ON table1.id = table2.id WHERE column1 = 'value1' ORDER BY column1 ASC LIMIT 10 OFFSET 20`;
console.log(tokenize(testSql))