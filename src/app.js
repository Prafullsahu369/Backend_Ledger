const express = require("express");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth.route");
const accountRoute = require("./routes/account.route");
const transactionRoute = require("./routes/transaction.routes");
const app = express();

app.get('/',(req,res)=>{
    res.send("Welcome to Bankend Ledger API")
}   
)

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/accounts", accountRoute);
app.use("/api/transactions", transactionRoute);

module.exports = app;
