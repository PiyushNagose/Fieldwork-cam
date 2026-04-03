const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROJECT_MEDIA_DIR = path.join(process.cwd(), "uploads", "project-media");

const ensureProjectMediaDir = () => {
  fs.mkdirSync(PROJECT_MEDIA_DIR, { recursive: true });
};

const normalizeBaseUrl = (value = "") => String(value || "").replace(/\/+$/, "");

const inferExtension = (mimeType = "") => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
};

const saveProjectDataUrlImage = ({ dataUrl, prefix, publicBaseUrl }) => {
  if (!dataUrl || typeof dataUrl !== "string") return "";

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return "";

  const [, mimeType, base64Data] = match;
  const extension = inferExtension(mimeType);
  const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;

  ensureProjectMediaDir();
  fs.writeFileSync(path.join(PROJECT_MEDIA_DIR, fileName), Buffer.from(base64Data, "base64"));

  return `${normalizeBaseUrl(publicBaseUrl)}/projects/uploads/project-media/${fileName}`;
};

module.exports = {
  saveProjectDataUrlImage,
};
