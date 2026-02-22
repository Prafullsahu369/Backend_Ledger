const express = require("express");
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router();

/**
 * - POST api/account/
 * - Create a new Account
 * - Protected Route
 */

router.post('/',authMiddleware.authMiddleware,accountController.createAccountCotroller)


/**
 * - GET api/account/
 * - Get all accounts of the user
 * - Protected Route
 */
router.get('/',authMiddleware.authMiddleware,accountController.getAllAccountsController)


/**
 * Get api/account/balance/:accountId
 * get
 */
router.get('/balance/:accountId',authMiddleware.authMiddleware,accountController.getAccountBalanceController)

module.exports = router;