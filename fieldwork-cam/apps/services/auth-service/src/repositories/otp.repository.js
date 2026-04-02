const Otp = require("../models/Otp.model");

const createOtp = (payload) => Otp.create(payload);

const findLatestOtpByPhone = (phone, purpose = "REGISTER") =>
  Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });

module.exports = {
  createOtp,
  findLatestOtpByPhone,
};
