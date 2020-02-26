const app = require("./app");
const port = process.env.PORT; // Setup the port

// Server listen port setup
app.listen(port, () => {
  console.log("Server is up on port " + port);
});