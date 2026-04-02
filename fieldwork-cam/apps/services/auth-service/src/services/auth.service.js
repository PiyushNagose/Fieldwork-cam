const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  findByPhone,
  findByEmail,
  findByInviteToken,
  createAuthUser,
  updateAuthUser,
} = require("../repositories/authUser.repository");
const { createAndStoreOtp, verifyOtpCode } = require("./otp.service");
const { generateToken } = require("./jwt.service");
const { publishEvent } = require("./publisher.service");
const { ROUTING_KEYS } = require("shared-events");
const ApiError = require("../utils/apiError");

const login = async (phone) => {
  const otpDoc = await createAndStoreOtp(phone, "REGISTER");

  return {
    phone,
    devOtp: otpDoc.code,
  };
};

const loginWithPhone = async ({ phone, password }) => {
  const user = await findByPhone(phone);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError("Account is not active", 403);
  }

  if (!user.inviteAccepted && user.role !== "ADMIN") {
    throw new ApiError("Please accept invite and set password first", 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash || "");

  if (!isMatch) {
    throw new ApiError("Invalid credentials", 401);
  }

  const token = generateToken({
    userId: user._id.toString(),
    phone: user.phone,
    email: user.email || "",
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email || "",
      role: user.role,
    },
  };
};

const loginWithEmail = async ({ email, password }) => {
  const user = await findByEmail(email);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError("Account is not active", 403);
  }

  if (!user.inviteAccepted && user.role !== "ADMIN") {
    throw new ApiError("Please accept invite and set password first", 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash || "");

  if (!isMatch) {
    throw new ApiError("Invalid credentials", 401);
  }

  const token = generateToken({
    userId: user._id.toString(),
    phone: user.phone,
    email: user.email || "",
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email || "",
      role: user.role,
    },
  };
};

const verifyOtp = async ({ phone, otp, password, role = "VENDOR_OWNER" }) => {
  await verifyOtpCode(phone, otp, "REGISTER");

  let user = await findByPhone(phone);
  const passwordHash = await bcrypt.hash(password, 10);

  if (!user) {
    user = await createAuthUser({
      phone,
      passwordHash,
      role,
      isPhoneVerified: true,
      status: "ACTIVE",
      inviteAccepted: true,
    });
  } else {
    user = await updateAuthUser(user._id, {
      isPhoneVerified: true,
      passwordHash: user.passwordHash || passwordHash,
      role: user.role || role,
      status: "ACTIVE",
      inviteAccepted: true,
    });
  }

  const token = generateToken({
    userId: user._id.toString(),
    phone: user.phone,
    email: user.email || "",
    role: user.role,
  });

  await publishEvent(ROUTING_KEYS.AUTH_USER_VERIFIED, {
    userId: user._id.toString(),
    phone: user.phone,
    role: user.role,
    isVerified: true,
    timestamp: new Date().toISOString(),
  });

  return {
    token,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email || "",
      role: user.role,
    },
  };
};

const inviteUser = async ({ phone, email, role }) => {
  const existingByPhone = await findByPhone(phone);

  if (existingByPhone) {
    // 🔥 CASE 1: Already invited but not accepted
    if (!existingByPhone.inviteAccepted) {
      return {
        authUser: existingByPhone,
        inviteToken: existingByPhone.inviteToken,
        inviteLink: `/accept-invite?token=${existingByPhone.inviteToken}`,
      };
    }

    // 🔥 CASE 2: Already active user
    throw new ApiError("User already registered and active", 400);
  }
  if (email) {
    const existingByEmail = await findByEmail(email);

    if (existingByEmail && !existingByEmail.inviteAccepted) {
      return {
        authUser: existingByEmail,
        inviteToken: existingByEmail.inviteToken,
        inviteLink: `/accept-invite?token=${existingByEmail.inviteToken}`,
      };
    }

    if (existingByEmail) {
      throw new ApiError("User already registered and active", 400);
    }
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await createAuthUser({
    phone,
    email,
    role,
    passwordHash: "",
    isPhoneVerified: false,
    isEmailVerified: false,
    inviteToken,
    inviteExpiresAt,
    inviteAccepted: false,
    status: "INVITED",
  });

  return {
    authUser: user,
    inviteToken,
    inviteLink: `/accept-invite?token=${inviteToken}`,
  };
};

const acceptInvite = async ({ token, password }) => {
  const user = await findByInviteToken(token);

  if (!user) {
    throw new ApiError("Invalid invite token", 404);
  }

  if (user.inviteAccepted) {
    throw new ApiError("Invite already accepted", 400);
  }

  if (!user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    throw new ApiError("Invite expired", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const updatedUser = await updateAuthUser(user._id, {
    passwordHash,
    inviteAccepted: true,
    status: "ACTIVE",
    isEmailVerified: !!user.email,
    inviteToken: "",
    inviteExpiresAt: null,
  });

  const authToken = generateToken({
    userId: updatedUser._id.toString(),
    phone: updatedUser.phone,
    email: updatedUser.email || "",
    role: updatedUser.role,
  });

  await publishEvent(ROUTING_KEYS.AUTH_USER_VERIFIED, {
    userId: updatedUser._id.toString(),
    phone: updatedUser.phone,
    role: updatedUser.role,
    isVerified: true,
    timestamp: new Date().toISOString(),
  });

  return {
    token: authToken,
    user: {
      id: updatedUser._id,
      phone: updatedUser.phone,
      email: updatedUser.email || "",
      role: updatedUser.role,
    },
  };
};

module.exports = {
  login,
  loginWithPhone,
  loginWithEmail,
  verifyOtp,
  inviteUser,
  acceptInvite,
};
