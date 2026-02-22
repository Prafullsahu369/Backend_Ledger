const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.header.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthoriazed acces , token is required ",
    });
    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);
    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized asscess , token is invalid",
    });
  }
}

async function  authSystemUserMiddleware(req, res, next) {
   const token = req.cookies.token || req.header.authorization?.split(" ")[1];

   if (!token) {
     return res.status(401).json({
       message: "Unauthorized access, token is required",
     });
   }
    const blacklistedToken = await tokenBlackListModel.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({
        message: "Unauthorized access, token is blacklisted",
      });
    }
    try{
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if (!user || !user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, system user role required",
      });
    }
    req.user = user;
    return next();
}catch(error){
    return res.status(401).json({
        message: "Unauthorized access, token is invalid",
      });
}
}
module.exports = {authMiddleware, authSystemUserMiddleware}