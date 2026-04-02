const createAndStoreOtp = async (phone, purpose = "REGISTER") => {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otpDoc = await createOtp({
    phone,
    code,
    expiresAt,
    purpose,
  });

  return otpDoc;
};

const verifyOtpCode = async (phone, otp, purpose = "REGISTER") => {
  const latestOtp = await findLatestOtpByPhone(phone, purpose);

  if (!latestOtp) {
    throw new ApiError("OTP not found", 404);
  }

  if (latestOtp.purpose !== purpose) {
    throw new ApiError("Invalid OTP purpose", 400);
  }

  if (latestOtp.verified) {
    throw new ApiError("OTP already used", 400);
  }

  if (latestOtp.expiresAt < new Date()) {
    throw new ApiError("OTP expired", 400);
  }

  if (latestOtp.code !== otp) {
    throw new ApiError("Invalid OTP", 400);
  }

  latestOtp.verified = true;
  await latestOtp.save();

  return true;
};

module.exports = {
  createAndStoreOtp,
  verifyOtpCode,
};
