require("dotenv").config();

const app = require("./src/app");
const conneectToDB = require("./src/config/db");

conneectToDB();
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});