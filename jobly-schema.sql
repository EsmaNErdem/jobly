CREATE TABLE companies (
  handle VARCHAR(25) PRIMARY KEY CHECK (handle = lower(handle)),
  name TEXT UNIQUE NOT NULL,
  num_employees INTEGER CHECK (num_employees >= 0),
  description TEXT NOT NULL,
  logo_url TEXT
);

CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE technologies (
  name TEXT UNIQUE NOT NULL,
  PRIMARY KEY (name)
);

-- equity with NUMERIC instead of FLOAT for high precision 
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  salary INTEGER CHECK (salary >= 0),
  equity NUMERIC CHECK (equity <= 1.0),
  company_handle VARCHAR(25) NOT NULL
    REFERENCES companies ON DELETE CASCADE
);

-- enumerated type for state col 
CREATE TYPE state AS ENUM ('interested', 'applied', 'accepted', 'rejected');
CREATE TABLE applications (
  application_state state,
  username VARCHAR(25)
    REFERENCES users ON DELETE CASCADE,
  job_id INTEGER
    REFERENCES jobs ON DELETE CASCADE,
  PRIMARY KEY (username, job_id)
);

CREATE TABLE job_technologies (
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  technology TEXT REFERENCES technologies(name) ON DELETE CASCADE,
  PRIMARY KEY (job_id, technology)
);

CREATE TABLE user_technologies (
  username VARCHAR(25) REFERENCES users(username) ON DELETE CASCADE,
  technology TEXT REFERENCES technologies(name) ON DELETE CASCADE,
  PRIMARY KEY (username, technology)
);
