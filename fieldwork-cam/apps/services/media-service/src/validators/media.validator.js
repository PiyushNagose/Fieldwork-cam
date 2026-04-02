const { body } = require("express-validator");

const uploadPhotoValidator = [
  body("projectId").notEmpty().withMessage("Project ID is required"),
  body("category").notEmpty().withMessage("Category is required"),
];

module.exports = {
  uploadPhotoValidator,
};
