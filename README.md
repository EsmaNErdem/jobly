# Jobly Backend

## Overview

The Jobly Backend is a RESTful API application designed to simulate a job search and application platform. During the development of this API, I focused on key aspects such as building a robust relational database, setting up an Express server with modularization and middleware, user authentication and authorization through JWT tokens, and maintaining code quality and test coverage.

## Features

* Modularization and Code Reusability: We've structured our application using object classes to enhance code reusability and maintainability. This allows for flexibility in adding new features or making changes with ease.

* Relational Database and Data Validation: We've implemented relational database schemas to keep data organized efficiently, enabling seamless data retrieval and storage. Incoming API data is validated using JSON Schema, ensuring data integrity while minizing risk of database error. 

* User Registration and Protected Routes: Users can register themselves using the /auth/register route. Admins also have the option to register users via the /user/ route. Certain routes are protected and accessible only to authorized users. We've implemented user authentication and authorization mechanisms using JWT tokens to secure these routes.

* Browsing and Filtering: Users can browse a list of companies and jobs, with the option to filter results based on their preferences. Users can access detailed information about companies and jobs along with related data. For instance, when viewing a company's details, users can see a list of open jobs associated with that company.

* Skill Management: Users can add their skills and technologies to their profiles. Jobs can also list the required technologies.

* Testing and Error Handling: The application includes extensive testing and error handling for every route and model method, ensuring a bug-free user experience.

# Tech Stack

* Node.js/Express: The backend server is built using Node.js and the Express framework.

* PostgreSQL: We use PostgreSQL as our relational database to store and manage data efficiently.

# To installing depencies 

1. Clone the Project: Navigate to the directory where you want to clone the project and run:

```
git clone https://github.com/EsmaNErdem/jobly.git
```

2. Initialize the Project: Inside the project directory, initialize the project by running: 

```
npm init
```

3. Install Dependencies: Install the project dependencies using npm:

```
npm install
```

4. Creating jobly database and test database while seeding initial data:

```
psql
\i jobly.sql
```

5. Run the Application: Start the server by running:

```
node server.js
```
    
6. Run Tests: To run the tests and ensure everything is working correctly, use Jest:

```
jest -i
```

## Navigating the Backen App

Once you've started the server, you can interact with the backend using any API testing tool like Insomnia. Here's how to get started:

### User Registration

1. Make a POST request to `/auth/register`.

2. In the request body, provide your user credentials in JSON format:

```json
{
  "username": "your-username",
  "password": "your-password",
  "firstName": "your-first-name",
  "lastName": "your-last-name",
  "email": "your-email",
  "technologies": "your-technologies"
}
```

3. Upon successful registration, you will receive a token. Alternatively, you can use a test admin token available in the jobly-seed.sql file.

### User Login

When sending next request to any route, simply include your token in the request headers as follows:

Authorization: Bearer your-token-here

This will authenticate you and grant access to protected routes. Enjoy exploring the app! 

## Contribution

We welcome contributions, ideas, and feedback to improve this application. Feel free to open issues, submit pull requests, or reach out with your suggestions. Your contributions are greatly appreciated.
