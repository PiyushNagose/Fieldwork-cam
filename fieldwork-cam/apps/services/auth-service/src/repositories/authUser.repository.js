const AuthUser = require("../models/AuthUser.model");

const findByPhone = (phone) => AuthUser.findOne({ phone });

const findByEmail = (email) => AuthUser.findOne({ email });

const findByInviteToken = (inviteToken) => AuthUser.findOne({ inviteToken });

const createAuthUser = (payload) => AuthUser.create(payload);

const updateAuthUser = (id, payload) =>
  AuthUser.findByIdAndUpdate(id, payload, { new: true });

module.exports = {
  findByPhone,
  findByEmail,
  findByInviteToken,
  createAuthUser,
  updateAuthUser,
};
