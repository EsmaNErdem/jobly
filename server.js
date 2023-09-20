"use strict";

const app = require("./app");
const { PORT } = require("./config") || 3030;

app.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});
