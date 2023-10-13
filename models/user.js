"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin, technologies }
   *
   * technologies should be [tech1, tech2...] }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin, technologies = [] }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    if (technologies.length !== 0) {
      user.technologies = []
      for (const tech of technologies) {
      // Check if the technology exists (case-insensitive search)
      let techRes = await db.query(
          `SELECT name
          FROM technologies
          WHERE name ILIKE $1`,
          [tech]
      )

      if (techRes.rows.length === 0) {
          // Technology doesn't exist, so insert it
          techRes = await db.query(
              `INSERT INTO technologies (name)
              VALUES ($1)
              RETURNING name`,
              [tech]
          )
      }

      const userTechs = await db.query(
          `INSERT INTO user_technologies (username, technology)
          VALUES ($1, $2)
          RETURNING technology`,
          [username, techRes.rows[0].name]
      )
      user.technologies.push(userTechs.rows[0].technology)
    }}

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );
    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, techologies, aplications }
   *   where technologies is [tech1, tech2]
   *   where application is [jobId1, jobId2]
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
    
    const userTechs = await db.query(
      `SELECT technology
      FROM user_technologies
      WHERE username = $1`,
      [username]
  )
  
  if (userTechs.rows.length !== 0) {
      user.technologies = userTechs.rows.map(t => t.technology)
  }

    const applications = await db.query(
      `SELECT job_id AS "jobId"
      FROM applications
      WHERE username = $1`,
      [username]
    )

    if (applications.rows.length !== 0) {
      user.applications =  applications.rows.map(a => a.jobId)
  }
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

 /** Given username, jobId from req.params and application state as req.body
  * 
   * states could be ('interested', 'applied', 'accepted', 'rejected')
   * default value of state is "interested"
   * 
   * Returns { state, jobId }
   *
   * Throws NotFoundError if user or job not found.
   **/

  static async applyToJob(username, jobId, { state }) {
    const userRes = await db.query(
      `SELECT username
      FROM users
      WHERE username = $1`,
      [username],
    );
    const user = userRes.rows[0]

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const jobRes = await db.query(
      `SELECT id
       FROM jobs
       WHERE id = $1`,
       [jobId],
    );
    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    if (!state) state = "interested"
    const application = await db.query(
      `INSERT INTO applications (username, job_id, application_state)
      VALUES ($1, $2, $3)
      RETURNING job_id AS "jobId", application_state AS state`,
      [username, jobId, state]);
    
    return application.rows[0]
  }

  /** Given username, jobId from req.params and updates application state
  * 
   * states could be ('interested', 'applied', 'accepted', 'rejected')
   * default value of state is "interested"
   * 
   * Returns { updatedState, jobId }
   *
   * Throws NotFoundError if user or job not found.
   **/

  static async updateApplication(username, jobId, data) {
    const userRes = await db.query(
      `SELECT username
      FROM users
      WHERE username = $1`,
      [username],
    );
    const user = userRes.rows[0]

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const jobRes = await db.query(
      `SELECT id
       FROM jobs
       WHERE id = $1`,
       [jobId],
    );
    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
    
    const { setCols, values } = sqlForPartialUpdate(data, {
      state: "application_state"
    })
    
    const updatedApplication = await db.query(
      `UPDATE applications
      SET ${setCols}
      WHERE username = $2 AND job_id = $3
      RETURNING job_id AS "jobId", application_state AS state`,
      [...values, username, jobId]);

    return updatedApplication.rows[0]
  }
}


module.exports = User;
