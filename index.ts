import parse from "./parser.js";
import tokenize from "./tokenizer.js"

const testQuery = `
SELECT * FROM users WHERE user_id =?1;
`
console.log(tokenize(testQuery))

const testSql = `SELECT column1 as c1, column2 FROM table1 t1 LEFT JOIN table2 t2 ON t1.id = t2.id WHERE column1 = 'value1' ORDER BY column1 ASC LIMIT 10 OFFSET 20`;
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