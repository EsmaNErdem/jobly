"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a data (from data), update db, return new data data.
   *
   * data should be { title, salary, equity, companyHandle, technologies }
   *
   * technologies should be [tech1, tech2...]
   * 
   * Returns { id, title, salary, equity, companyHandle, technologies }
   *
   * Throws BadRequestError if job already in database.
   * */
    static async create({ title, salary, equity, companyHandle, technologies = [] }) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, 
                salary, 
                equity, 
                company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title, 
                salary, 
                equity, 
                companyHandle
            ],
        )

        const job = result.rows[0]
        
        if (technologies.length !== 0) {
            job.technologies = []
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

            const jobTechs = await db.query(
                `INSERT INTO job_technologies (job_id, technology)
                VALUES ($1, $2)
                RETURNING technology`,
                [job.id, techRes.rows[0].name]
            )
            job.technologies.push(jobTechs.rows[0].technology)
        }}
        
        return job
    }


    /** Find all jobs.
    *
    * * searchFilters (all optional):
    * - minSalary
    * - hasEquity
    * - title (will find case-insensitive, partial matches)
    * 
    *  checks if request includes filter. If it does, creating SQL query accordingly
    * 
    * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
    * */

    static async findAll(filters = {}) {
        const {title, minSalary, hasEquity} = filters;
        const whereExpressions = [];
        const values = [];
        if (title) {
            values.push(`%${title}%`)
            whereExpressions.push(`title ILIKE $${values.length}`)
        }
        if (minSalary != undefined) {
            values.push(minSalary)
            whereExpressions.push(`salary >= $${values.length}`)
        }
        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`)
        }

        let query = `SELECT j.id, 
                    j.title, 
                    j.salary, 
                    j.equity, 
                    j.company_handle AS "companyHandle",
                    c.name AS "companyName"
                    FROM jobs j
                    LEFT JOIN companies AS c
                        ON j.company_handle = c.handle`;
        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ")
        }
        query += " ORDER BY title"
        const jobsRes = await db.query(query, values);

        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
    *
    * Returns { id, title, salary, equity, companyHandle, company }
    *
    * Throws NotFoundError if not found.
    **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, 
                title, 
                salary, 
                equity,
                company_handle AS "companyHandle"
            FROM jobs 
            WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle AS "companyHandle",
                    name AS "companyName",
                    description AS "companyDescription",
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandle]);
  
        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        const jobTechs = await db.query(
            `SELECT technology
            FROM job_technologies
            WHERE job_id = $1`,
            [id]
        )
        
        if (jobTechs.rows.length !== 0) {
            job.technologies = jobTechs.rows.map(t => t.technology)
        }


        return job;
    }

   /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job