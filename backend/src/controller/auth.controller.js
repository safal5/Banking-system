const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { registerEmail, verifyEmail } = require("../services/email.service");
const crypto = require("crypto");
const otpModel = require("../models/otp.model");
const config = require("../config/config").config;
const sessionModel = require("../models/session.model");
const { generateOtp, getOtpHtml } = require("../utils/utils");

async function userRegister(req, res) {
  const { username, email, password } = req.body;
  const userExists = await userModel.findOne({ email });
  if (userExists) {
    return res.status(422).json({
      message: "email already exists",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    username,
    password,
  });

  const otp = generateOtp();
  const otpHash = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  const newOtp = await otpModel.create({
    email,
    otpHash,
    user: user._id,
  });
  const otpHtml = getOtpHtml(otp);

  await verifyEmail(email, otp, otpHtml);

  res.status(201).json({
    message:
      "user successfully created. Please verify your email using the OTP sent to your email address",
    user,
  });
}

async function currentUser(req, res) {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies.refreshToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "unauthorized access! token not found" });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRETKEY);
    const findUser = await userModel.findById(decoded.id).select("+systemUser");

    if (!findUser) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json({
      user_id: findUser._id,
      email: findUser.email,
      username: findUser.username,
      systemUser: findUser.systemUser,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "session expired, please log in again" });
    }

    return res.status(401).json({ message: "invalid authentication token" });
  }
}

async function userLogin(req, res) {
  const { email, password } = req.body;
  const userExists = await userModel.findOne({ email }).select("+password");
  if (!userExists) {
    return res.status(400).json({
      message: "Either email or password is incorrect",
    });
  }
  try {
    const isPasswordCorrect = await userExists.comparePassword(password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "Either email or password is incorrect" });
    }
    if (!userExists.verified) {
      return res.status(400).json({
        message: "Please verify your email before logging in",
      });
    }
    const refreshToken = jwt.sign(
      { id: userExists._id },
      config.JWT_SECRETKEY,
      { expiresIn: "30m" },
    );
    const refershTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const newSession = await sessionModel.create({
      user: userExists._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      refreshToken: refershTokenHash,
      revoked: false,
    });
    const accessToken = jwt.sign({ id: userExists._id }, config.JWT_SECRETKEY, {
      expiresIn: "15m",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 30 * 60 * 1000,
    });
    res.status(200).json({
      message: "you are succesfully logged it",
      accessToken,
      username: userExists.username,
      email: userExists.email,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
}

async function getAccessToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Token not found",
    });
  }
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await sessionModel.findOne({
    refreshToken: refreshTokenHash,
    revoked: false,
  });
  if (!session) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
  const decoded = jwt.verify(refreshToken, config.JWT_SECRETKEY);
  const accessToken = jwt.sign({ id: decoded.id }, config.JWT_SECRETKEY, {
    expiresIn: "15m",
  });
  const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRETKEY, {
    expiresIn: "30m",
  });
  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  session.refreshToken = newRefreshTokenHash;
  await session.save();
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: 30 * 60 * 1000,
  });
  res.status(200).json({
    message: "token created successfully",
    accessToken,
  });
}
async function userLogout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Token not found",
    });
  }
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await sessionModel.findOne({
    refreshToken: refreshTokenHash,
    revoked: false,
  });
  if (!session) {
    return res.status(400).json({
      message: "Invalid Token",
    });
  }
  session.revoked = true;
  await session.save();
  res.clearCookie("refreshToken");
  res.status(200).json({
    message: "loggedOut successfully",
  });
}

async function logoutAll(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Token not found",
    });
  }
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRETKEY);
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const currentSession = await sessionModel.findOne({
      user: decoded.id,
      refreshToken: refreshTokenHash,
      revoked: false,
    });
    if (!currentSession) {
      return res.status(401).json({ message: "Invalid token" });
    }
    await sessionModel.updateMany(
      { user: decoded.id, revoked: false },
      { revoked: true },
    );
    res.clearCookie("refreshToken");
    return res
      .status(200)
      .json({ message: "Logged out successfully from all device" });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function verifyyourEmail(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  const otpHash = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  const findOtp = await otpModel.findOne({
    email,
    otpHash,
    expiresAt: { $gt: new Date() },
  });
  if (!findOtp) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }
  const user = await userModel.findById(findOtp.user);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  user.verified = true;
  await user.save();
  await otpModel.deleteMany({ email });
  await registerEmail(user.username, user.email);
  return res.status(200).json({
    message: "Email verified successfully",
  });
}

async function resendOtp(req, res) {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  if (user.verified) {
    return res.status(400).json({
      message: "Email already verified",
    });
  }
  const otp = generateOtp();
  const otpHash = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  await otpModel.deleteMany({ email });
  const newOtp = await otpModel.create({
    email,
    otpHash,
    user: user._id,
  });
  const otpHtml = getOtpHtml(otp);
  await verifyEmail(email, otp, otpHtml);
  return res.status(200).json({
    message: "OTP resent successfully",
  });
}

module.exports.userRegister = userRegister;
module.exports.getAccessToken = getAccessToken;
module.exports.userLogin = userLogin;
module.exports.userLogout = userLogout;
module.exports.logoutAll = logoutAll;
module.exports.currentUser = currentUser;
module.exports.verifyyourEmail = verifyyourEmail;
module.exports.resendOtp = resendOtp;
