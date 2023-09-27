"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureAdminOrCorrectUser, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const userApplicationStateSchema = require("../schemas/userApplicationState.json");
const generatePassword = require('generate-password');

const router = express.Router();


/** POST / { user }  => { user, token }
 * 
 * data should be { username, firstName, lastName, email, isAdmin, technologies }
 * 
 * technologies should be array of techs
 * 
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 * 
 * Later user can change their password with a provided token, at patch /user/:username route. 
 *
 * Authorization required: login
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    // generating a random password
    req.body.password = generatePassword.generate({
      length: 12,          // Adjust the desired password length
      numbers: true,       // Include numbers
      symbols: true,       // Include symbols
      uppercase: true,     // Include uppercase letters
      lowercase: true,     // Include lowercase letters
      strict: true,        // Ensure at least one character from each group
    });
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: must be an admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, first_name, last_name, is_admin, techologies, aplications }
 *   where technologies is [tech1, tech2]
 *   where application is [jobId1, jobId2]
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.get("/:username", ensureAdminOrCorrectUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureAdminOrCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureAdminOrCorrectUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/** Post /[username]/jobs/[id] { state } => { state: jobId }
 * 
 * states could be ('interested', 'applied', 'accepted', 'rejected')
 * default value of state is "interested"
 * 
 * Returns { state: jobId }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.post("/:username/jobs/:id", ensureAdminOrCorrectUser, async function (req, res, next) {
  try {
    
    const validator = jsonschema.validate(req.body, userApplicationStateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobId = +req.params.id;
    const application = await User.applyToJob(req.params.username, jobId, req.body);
    return res.json({ [application.state]: jobId });
  } catch (err) {
    return next(err);
  }
});


/** Patch /[username]/jobs/[id] { state } => { state: jobId }
 * 
 * states could be ('interested', 'applied', 'accepted', 'rejected')
 * default value of state is "interested"
 * 
 * Returns updated state { state: jobId }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username/jobs/:id", ensureAdminOrCorrectUser, async function (req, res, next) {
  try {
    
    const validator = jsonschema.validate(req.body, userApplicationStateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobId = +req.params.id;
    const updatedApplication = await User.updateApplication(req.params.username, jobId, req.body);
    return res.json({ [updatedApplication.state]: jobId });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
