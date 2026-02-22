const { Router } = require("express");
const transactionRoutes = Router();
const authMiddleware = require("../middleware/auth.middleware");

const transactionController = require("../controllers/transaction.controller");

/*
 *-Post/api/transactions
 *-Create a new transaction
 *-Request
 */
transactionRoutes.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);

/*
 * -post/api/transactions/system/intial-funds
 */

transactionRoutes.post(
  "/system/initial-funds",
  authMiddleware.authSystemUserMiddleware,
  transactionController.createIntitalFundsTransaction,
);

module.exports = transactionRoutes;
