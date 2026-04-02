const env = require("../config/env");

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const buildInviteEmailHtml = ({
  recipientName,
  inviteLink,
  companyName,
  expiresInDays = 7,
}) => {
  const greetingName = recipientName || companyName || "there";

  return `
    <div style="margin:0;padding:32px 0;background:#f5efe9;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eee4dc;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(31,41,55,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#f3e5dc 0%,#efe7e1 100%);border-bottom:1px solid #eee4dc;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9a7d6b;">FieldWork Cam</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#1f2937;">You&apos;re invited to join as a vendor</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">Hi ${escapeHtml(greetingName)},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">
            Your account has been created in FieldWork Cam. Use the secure invite link below to set your password and access your vendor dashboard.
          </p>
          <div style="margin:28px 0;">
            <a href="${inviteLink}" style="display:inline-block;padding:14px 22px;background:#8d7b72;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">
              Set Password & Open Dashboard
            </a>
          </div>
          <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#6b7280;">
            This invite link is valid for ${expiresInDays} days.
          </p>
          <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#6b7280;">
            If the button does not work, copy and paste this URL into your browser:
          </p>
          <p style="margin:0;padding:14px 16px;background:#faf7f4;border:1px solid #eee4dc;border-radius:10px;font-size:12px;line-height:1.7;color:#6b7280;word-break:break-all;">
            ${escapeHtml(inviteLink)}
          </p>
        </div>
      </div>
    </div>
  `;
};

const buildInviteEmailText = ({ inviteLink, expiresInDays = 7 }) =>
  [
    "You have been invited to join FieldWork Cam as a vendor.",
    "",
    "Set your password and open your dashboard using this secure link:",
    inviteLink,
    "",
    `This invite link is valid for ${expiresInDays} days.`,
  ].join("\n");

const sendWithResend = async ({ to, subject, html, text }) => {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed: ${body}`);
  }

  const result = await response.json();
  return {
    sent: true,
    provider: "resend",
    messageId: result?.id || "",
  };
};

const sendWithSmtp = async ({ to, subject, html, text }) => {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.EMAIL_FROM) {
    return null;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    throw new Error("SMTP is configured but nodemailer is not installed");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: String(env.SMTP_SECURE).toLowerCase() === "true",
    auth:
      env.SMTP_USER || env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  return {
    sent: true,
    provider: "smtp",
    messageId: info?.messageId || "",
  };
};

const sendInviteEmail = async ({
  to,
  recipientName,
  companyName,
  inviteLink,
  expiresInDays = 7,
}) => {
  if (!to) {
    return {
      sent: false,
      skipped: true,
      reason: "No recipient email provided",
    };
  }

  const subject = "You have been invited to FieldWork Cam";
  const html = buildInviteEmailHtml({
    recipientName,
    inviteLink,
    companyName,
    expiresInDays,
  });
  const text = buildInviteEmailText({ inviteLink, expiresInDays });

  const resendResult = await sendWithResend({ to, subject, html, text });
  if (resendResult) {
    return resendResult;
  }

  const smtpResult = await sendWithSmtp({ to, subject, html, text });
  if (smtpResult) {
    return smtpResult;
  }

  return {
    sent: false,
    skipped: true,
    reason: "Email provider not configured",
  };
};

const buildInviteLink = ({ inviteToken, inviteBaseUrl }) => {
  const baseUrl = trimTrailingSlash(inviteBaseUrl || env.APP_WEB_URL);
  return `${baseUrl}/accept-invite?token=${inviteToken}`;
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  buildInviteLink,
  sendInviteEmail,
};
