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
    };
    // When you insert data into NUMERIC column, it is being stored as a string in the database, which is the default behavior for most SQL database systems when you insert a numeric value as a string.
    test("works", async function () {
        const job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number),
        });
    })
    console.log(testJobIds, "eeeeeeeeee")
})

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
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
  