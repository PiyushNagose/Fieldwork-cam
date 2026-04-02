const { body } = require("express-validator");

const addProjectNoteValidator = [
  body("note").notEmpty().withMessage("Note is required"),
];

module.exports = {
  addProjectNoteValidator,
};
