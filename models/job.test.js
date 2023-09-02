"use strict";
process.env.NODE_ENV = "test";
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************** create */ 
describe("create", function () {
    const newJob = {
        title: "test",
        salary: 100,
        equity: "0.05",
        companyHandle: "c1",
        technologies: ["Python", "Javascript", "C/C++"]
    };
    // When you insert data into NUMERIC column, it is being stored as a string in the database, which is the default behavior for most SQL database systems when you insert a numeric value as a string.
    test("works", async function () {
        const job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number),
        });
    })
  })
  
/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
            id: testJobIds[0],
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
            salary: null,
            equity: null,
            companyHandle: "c1",
            companyName: "C1",

        },
      ]);
    });
  
    test("works: with filters", async function () {
      const filters = {
        title: "job",
        minSalary: 200,
        hasEquity: true,
      }
      const jobs = await Job.findAll(filters);
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "Job2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",

        },
      ])
    })
  
    test("works: with partial filters minSalary", async function () {
      const filters = {
        minSalary: 300
      }
      const jobs = await Job.findAll(filters);
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "Job3",
            salary: 300,
            equity: "0",
            companyHandle: "c1",
            companyName: "C1",

        },
      ])
    })

    test("works: with partial filters hasEquity: true", async function () {
        const filters = {
            hasEquity: true
        }
        const jobs = await Job.findAll(filters);
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
    
            },
        ])
    })

    test("works: with no matching result", async function () {
      const filters = {
        title: "wrong"
      }
      const jobs = await Job.findAll(filters);
        expect(jobs).toEqual([])
    })
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobIds[0]);
    expect(job).toEqual({
      id: testJobIds[0],
      title: "Job1",
      salary: 100,
      equity: "0.1",
      company:{
        companyHandle: "c1",
        companyName: "C1",
        companyDescription: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      technologies: ["Python", "Javascript"]
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
  
/************************************** update */

describe("update", function () {
  let updateData = {
    title: "New",
    salary: 500,
    equity: "0.5",
  };

  test("works", async function () {
    let job = await Job.update(testJobIds[0], updateData);
    expect(job).toEqual({
      id: testJobIds[0],
      companyHandle: "c1",
      ...updateData,
    });
  });

  let updatePartialData = {
    equity: "0.5",
  };

  test("works with partial data", async function () {
    let job = await Job.update(testJobIds[1], updatePartialData);
    expect(job).toEqual({
      id: testJobIds[1],
      companyHandle: "c1",
      title: "Job2",
      salary: 200,
      ...updatePartialData,
    });
  });
 

  test("not found if no such job", async function () {
    try {
      await Job.update(0, {
        title: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
        `SELECT title FROM jobs WHERE id=${testJobIds[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
