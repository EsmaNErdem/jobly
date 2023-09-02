"use strict";

const request = require("supertest");
process.env.NODE_ENV = "test";
const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: "0.6",
    companyHandle: "c1",
    technologies: ["Python", "Javascript"]
  };

  const newJob2 = {
    title: "new",
    salary: 100,
    equity: "0.6",
    companyHandle: "c1"
  };

  test("ok for admin with techs", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob,
      }
    });
  });

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob2)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob2,
      }
    });
  });


  test("fails for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 100,
          equity: "0.6",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newJob,
          salary: "100",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

})

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon with no filter", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "Job1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "Job2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "Job3",
              salary: 300,
              equity: "0",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "Job4",
              salary:  null,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
    });
  })

  test("ok for anon with filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        minSalary: 200,
        hasEquity: true,
        title: "jo"
    });
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "Job2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
    });
  });

  test("ok for anon with partial filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        minSalary: 200,
    });
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "Job2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "Job3",
              salary: 300,
              equity: "0",
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
    });
  });

  test("bad attemp with invalid title filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        title: "",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad attemp with invalid filter", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        title: "3",
        bad: "bad"
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad attemp with invalid hasEquity filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        hasEquity: "bad",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs");
    expect(resp.statusCode).toEqual(500);
  });
})


/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        company: 
          {
            companyHandle: "c1",
            companyName: "C1",
            companyDescription: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        technologies: ["Python", "Javascript"]
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});
  /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "newJob",
          salary: 10000, 
          equity: "0.8",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "newJob",
        salary: 10000,
        equity: "0.8",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "newJob",
          salary: 10000, 
          equity: "0.8"
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "newJob",
          salary: 10000, 
          equity: "0.8"
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "newJob",
          salary: 10000, 
          equity: "0.8"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          companyHandle: "c2",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          salary: "10000", 
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

