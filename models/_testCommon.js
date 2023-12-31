const bcrypt = require("bcrypt");
process.env.NODE_ENV = "test";
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testJobIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM applications");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM technologies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM job_technologies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM user_technologies");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
    INSERT INTO users(username,
                      password,
                      first_name,
                      last_name,
                      email)
    VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
            ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
    RETURNING username`,
  [
    await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
    await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
  ]);

  const resultsJobs = await db.query(`
    INSERT INTO jobs (title, salary, equity, company_handle)
    VALUES ('Job1', 100, '0.1', 'c1'),
          ('Job2', 200, '0.2', 'c1'),
          ('Job3', 300, '0', 'c1'),
          ('Job4', NULL, NULL, 'c1')
    RETURNING id`);

  testJobIds.splice(0, 0, ...resultsJobs.rows.map(r => r.id));

  await db.query(`
    INSERT INTO applications (username, job_id, application_state)
    VALUES ('u1', $1, 'interested'),
          ('u1', $2, 'rejected')`,
    [testJobIds[0], testJobIds[2]]);
  
  await db.query(`
  INSERT INTO technologies (name)
  VALUES ('Python'),
        ('Javascript')`
  )

  await db.query(`
  INSERT INTO job_technologies (job_id, technology)
  VALUES ($1, 'Python'),
        ($1, 'Javascript'),
        ($2, 'Python')`,
  [testJobIds[0], testJobIds[2]]);

  await db.query(`
  INSERT INTO user_technologies (username, technology)
  VALUES ('u1', 'Python'),
        ('u1', 'Javascript'),
        ('u2', 'Python')`
  )

}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
};