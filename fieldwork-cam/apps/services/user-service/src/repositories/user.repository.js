const User = require("../models/User.model");

const findByAuthUserId = (authUserId) => User.findOne({ authUserId });

const createUser = (payload) => User.create(payload);

const updateUser = (authUserId, payload) =>
  User.findOneAndUpdate({ authUserId }, payload, { new: true });

const findUserByEmail = (email) => User.findOne({ email });

module.exports = {
  findByAuthUserId,
  createUser,
  updateUser,
  findUserByEmail,
};
