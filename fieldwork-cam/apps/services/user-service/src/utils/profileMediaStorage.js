const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROFILE_MEDIA_DIR = path.join(process.cwd(), "uploads", "profile-media");

const ensureProfileMediaDir = () => {
  fs.mkdirSync(PROFILE_MEDIA_DIR, { recursive: true });
};

const normalizeBaseUrl = (value = "") => String(value || "").replace(/\/+$/, "");

const inferExtension = (mimeType = "") => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
};

const saveDataUrlImage = ({ dataUrl, prefix, publicBaseUrl }) => {
  if (!dataUrl || typeof dataUrl !== "string") return "";

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return "";

  const [, mimeType, base64Data] = match;
  const extension = inferExtension(mimeType);
  const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;

  ensureProfileMediaDir();
  fs.writeFileSync(path.join(PROFILE_MEDIA_DIR, fileName), Buffer.from(base64Data, "base64"));

  return `${normalizeBaseUrl(publicBaseUrl)}/users/uploads/profile-media/${fileName}`;
};

module.exports = {
  saveDataUrlImage,
};
