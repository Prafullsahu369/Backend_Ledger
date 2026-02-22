const express = require("express");
const authController = require("../controllers/auth.controller")
const router = express.Router();

/**
 * -POST /api/auth/register
 * - Register a new user
 */
router.post('/register',authController.userRegisterController)
router.post('/login',authController.userLoginController)
router.post('/logout',authController.userLogoutController)





module.exports= router;
