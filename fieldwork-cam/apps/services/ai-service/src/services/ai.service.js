const axios = require("axios");
const sharp = require("sharp");
const env = require("../config/env");

const average = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

const estimateBrightness = async (buffer) => {
  const { data, info } = await sharp(buffer)
    .resize({ width: 64, height: 64, fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const values = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    values.push((r + g + b) / 3);
  }

  return average(values);
};

const estimateSharpnessProxy = async (buffer) => {
  const { data } = await sharp(buffer)
    .greyscale()
    .resize({ width: 64, height: 64, fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let diffSum = 0;
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    diffSum += Math.abs(data[i] - data[i - 1]);
    count++;
  }

  return diffSum / (count || 1);
};

const verifyOnePhoto = async (photo) => {
  const imageRes = await axios.get(photo.fileUrl, {
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(imageRes.data);

  const meta = await sharp(buffer).metadata();
  const brightness = await estimateBrightness(buffer);
  const sharpnessProxy = await estimateSharpnessProxy(buffer);

  const clarity = sharpnessProxy >= 8;
  const lighting = brightness >= 60 && brightness <= 220;
  const subjectCoverage = (meta.width || 0) >= 800 && (meta.height || 0) >= 600;
  const gpsVerification =
    typeof photo.gpsLatitude === "number" &&
    typeof photo.gpsLongitude === "number";
  const timestampValid = !!photo.timestampCaptured;

  let score = 0;
  if (clarity) score += 25;
  if (lighting) score += 20;
  if (subjectCoverage) score += 20;
  if (gpsVerification) score += 20;
  if (timestampValid) score += 15;

  const passed = score >= 70;

  return {
    photoId: photo._id,
    fileUrl: photo.fileUrl,
    score,
    passed,
    checks: {
      clarity,
      lighting,
      subjectCoverage,
      gpsVerification,
      timestampValid,
    },
    summary: passed
      ? "High probability of approval"
      : "Quality issue detected. Review before submission.",
    reasons: [
      !clarity ? "Blur detected" : null,
      !lighting ? "Lighting quality issue" : null,
      !subjectCoverage ? "Low image dimensions / weak coverage" : null,
      !gpsVerification ? "GPS missing or invalid" : null,
      !timestampValid ? "Timestamp missing" : null,
    ].filter(Boolean),
  };
};

const patchMediaPhoto = async (photoId, payload, authHeader) => {
  await axios.patch(
    `${env.MEDIA_SERVICE_URL}/internal/media/${photoId}/ai-result`,
    payload,
    {
      headers: {
        authorization: authHeader,
      },
    },
  );
};

const verifyPhotoService = async (photoId, authHeader) => {
  const res = await axios.get(
    `${env.MEDIA_SERVICE_URL}/internal/media/${photoId}`,
    {
      headers: {
        authorization: authHeader,
      },
    },
  );

  const photo = res.data?.data || res.data;
  const result = await verifyOnePhoto(photo);

  await patchMediaPhoto(
    photoId,
    {
      aiStatus: result.passed ? "Passed" : "Failed",
      aiScore: result.score,
      aiChecks: result.checks,
    },
    authHeader,
  );

  return result;
};

const verifyProjectPhotosService = async (projectId, authHeader) => {
  const res = await axios.get(
    `${env.MEDIA_SERVICE_URL}/media/project/${projectId}`,
    {
      headers: {
        authorization: authHeader,
      },
    },
  );

  const photos = res.data?.data || [];
  const results = [];

  for (const photo of photos) {
    const result = await verifyOnePhoto(photo);

    await patchMediaPhoto(
      photo._id,
      {
        aiStatus: result.passed ? "Passed" : "Failed",
        aiScore: result.score,
        aiChecks: result.checks,
      },
      authHeader,
    );

    results.push(result);
  }

  const averageScore = results.length
    ? Math.round(
        results.reduce((acc, item) => acc + item.score, 0) / results.length,
      )
    : 0;

  return {
    projectId,
    totalPhotos: results.length,
    passedPhotos: results.filter((x) => x.passed).length,
    failedPhotos: results.filter((x) => !x.passed).length,
    averageScore,
    allPassed: results.every((x) => x.passed),
    results,
  };
};

module.exports = {
  verifyPhotoService,
  verifyProjectPhotosService,
};
