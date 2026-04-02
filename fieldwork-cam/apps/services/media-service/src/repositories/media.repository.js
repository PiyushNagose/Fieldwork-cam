const Photo = require("../models/Photo.model");

const createPhoto = (payload) => Photo.create(payload);

const getProjectPhotos = (projectId) =>
  Photo.find({ projectId }).sort({ createdAt: -1 });

const getProjectPhotosByCategory = (projectId, category) =>
  Photo.find({ projectId, category }).sort({ createdAt: -1 });

const getPhotoById = (photoId) => Photo.findById(photoId);

const deletePhotoById = (photoId) => Photo.findByIdAndDelete(photoId);

const updatePhotoById = (photoId, payload) =>
  Photo.findByIdAndUpdate(photoId, payload, { new: true });

module.exports = {
  createPhoto,
  getProjectPhotos,
  getProjectPhotosByCategory,
  getPhotoById,
  deletePhotoById,
  updatePhotoById,
};
