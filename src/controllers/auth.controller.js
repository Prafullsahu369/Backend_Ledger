const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");
const emailService = require("../services/email.service");
/**
 * -user registration controller
 * -POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, password, name } = req.body;
  const isExist = await userModel.findOne({ email: email });
  if (isExist) {
    return res.status(422).json({
      success: false,
      message: "User already exists",
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token);
  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
  await emailService.sendRegistrationEmail(user.email, user.name);
}

/**
 * -user login controller
 * -POST /api/auth/login
 */

async function userLoginController(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found",
    });
  }
  const VaildatePassword = await user.comparePassword(password);
  if (!VaildatePassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token);
  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
 await emailService.sendLoginEmail(user.email, user.name);
}

async function userLogoutController(req,res){
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      message: "Token is required for logout",
    });
  }
  await tokenBlackListModel.create({ token:token });
  res.clearCookie("token");
  res.status(200).json({
    message: "User logged out successfully",
  });
}
module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
