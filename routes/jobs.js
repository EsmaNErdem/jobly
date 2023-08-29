"use strict";
/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job")

const jobNewSchema = require("../schemas/jobNew.json")
const jobFilterSchema = require("../schemas/jobSearchSchema.json")
const jobUpdateSchema = require("../schemas/jobUpdate.json")



/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary (integer)
 * - hasEquity (boolean)
 *
 * Authorization required: none
 */

// GET /jobs?title=example&minSalary=1000
router.get("/", async function (req, res, next) {
    const query = req.query
  // converting string to int and boolean
    if(query.minSalary !== undefined) query.minSalary = +query.minSalary;
    if(query.hasEquity === "true") query.hasEquity = true
  
    try {
      const validator = jsonschema.validate(query, jobFilterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const jobs = await Job.findAll(query);
  
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  job is { id, title, salary, equity, company }
 *   where company obj is { companyHandle, companyName, companyDescription, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

// req.params is used to access route parameters defined in the URL path
router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  
  
  module.exports = router;
  
  