
const crypto = require("crypto");
const axios = require("axios");
require('dotenv').config()
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL;
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;

/**
 * Create applicant
 */
exports.createApplicant = async (user) => {
  const res = await axios.post(
    `${SUMSUB_BASE_URL}/resources/applicants`,
    {
      externalUserId: user.id,
      email: user.email,
    },
    getHeaders("POST", "/resources/applicants")
  );

  return res.data.id;
};

/**
 * Generate SDK access token
 */
exports.generateAccessToken = async (applicantId) => {
  const url = `/resources/accessTokens?userId=${applicantId}&ttlInSecs=600`;

  const res = await axios.post(
    `${SUMSUB_BASE_URL}${url}`,
    null,
    getHeaders("POST", url)
  );

  return res.data.token;
};

/**
 * Verify webhook signature
 */
exports.verifyWebhookSignature = (req) => {
  const signature = req.headers["x-payload-digest"];
  const payload = JSON.stringify(req.body);

  const hmac = crypto
    .createHmac("sha256", SUMSUB_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return signature === hmac;
};

/**
 * Signed headers
 */
function getHeaders(method, path) {
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", SUMSUB_SECRET_KEY)
    .update(ts + method + path)
    .digest("hex");

  return {
    headers: {
      "X-App-Token": SUMSUB_APP_TOKEN,
      "X-App-Access-Sig": signature,
      "X-App-Access-Ts": ts,
      "Content-Type": "application/json",
    },
  };
}
