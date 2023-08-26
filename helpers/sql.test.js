const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql")

describe("parameterizedQueries", function () {
    test("works with company data that contains all the fields", function () {
        const companyData = {
            name:"test", 
            description:"test desc", 
            numEmployees:10, 
            logoUrl:"http://test.img"
        }
        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }
        const {setCols, values} = sqlForPartialUpdate(companyData, jsToSql)
        expect(setCols).toEqual('"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4')
        expect(values).toEqual(["test", "test desc", 10, "http://test.img"])
    })

    test("works with user data that contains all the fields", function () {
        const companyData = {
            password:"test", 
            firstName:"testFirst", 
            lastName:"testLast", 
            email:"test@email.com",
            isAdmin: false
        }
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        const {setCols, values} = sqlForPartialUpdate(companyData, jsToSql)
        expect(setCols).toEqual('"password"=$1, "first_name"=$2, "last_name"=$3, "email"=$4, "is_admin"=$5')
        expect(values).toEqual(["test", "testFirst", "testLast", "test@email.com", false])
    })

    test("works with company data that contains partial fields", function () {
        const companyData = {
            name:"test", 
            description:"test desc", 
        }
        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }
        const {setCols, values} = sqlForPartialUpdate(companyData, jsToSql)
        expect(setCols).toEqual('"name"=$1, "description"=$2')
        expect(values).toEqual(["test", "test desc"])
    })

    test("works with user data that contains all the fields", function () {
        const companyData = {
            password:"test", 
            isAdmin: false
        }
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        const {setCols, values} = sqlForPartialUpdate(companyData, jsToSql)
        expect(setCols).toEqual('"password"=$1, "is_admin"=$2')
        expect(values).toEqual(["test", false])
    })

    test("test error when no company data", function () {
        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }
        expect(() => sqlForPartialUpdate({}, jsToSql)).toThrowError(BadRequestError);
    })

    test("test error when no user data", function () {
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        try {
            sqlForPartialUpdate({}, jsToSql)
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })
})