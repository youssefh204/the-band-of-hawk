import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

/* ===============================================================
   GOOGLE OAUTH2 CLIENT
================================================================ */
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// SET REFRESH TOKEN
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

/* ===============================================================
   CREATE TRANSPORTER WITH ACCESS TOKEN  
================================================================ */
async function getTransporter() {
  try {
const accessTokenObject = await oAuth2Client.getAccessToken();
const accessToken = accessTokenObject?.token;

if (!accessToken) {
  console.error("❌ Failed to retrieve access token from Google OAuth2");
  throw new Error("No access token provided by OAuth2");
}

    if (!accessTokenObject?.token) {
      throw new Error("Failed to generate access token");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessTokenObject.token,
      },
    });
  } catch (err) {
    console.error("❌ Error creating OAuth2 transporter:", err);
    throw err;
  }
}

/* ===============================================================
   SEND VERIFICATION EMAIL
================================================================ */
export const sendVerificationEmail = async (email, name, token) => {
  const transporter = await getTransporter();
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"The Band of the Hawk" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#0a0a0a; font-family:-apple-system,BlinkMacSystemFont;">
        <table style="width:100%; background:#0a0a0a;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#1a1a1a; border-radius:8px;">
              <tr><td style="text-align:center; padding:40px;">
                <h1 style="color:#fff;">Verify Your Email</h1>
              </td></tr>

              <tr><td style="padding:0 40px 40px;">
                <p style="color:#a1a1aa;">Hi ${name},</p>
                <p style="color:#a1a1aa;">Click the button below to verify your email address.</p>

                <div style="text-align:center; margin:30px 0;">
                  <a href="${verificationLink}" 
                    style="padding:14px 32px; background:#8b5cf6; color:white; text-decoration:none; border-radius:6px;">
                    Verify Email Address
                  </a>
                </div>

                <p style="color:#71717a;">Or copy this link:</p>
                <p style="color:#8b5cf6; word-break:break-all;">${verificationLink}</p>
              </td></tr>

              <tr><td style="padding:20px; background:#0a0a0a; text-align:center;">
                <p style="color:#52525b; font-size:12px;">This is an automated email.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/* ===============================================================
   SEND WARNING EMAIL
================================================================ */
export const sendWarningEmail = async (email, name, commentContent, reason, warningCount) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"The Band of the Hawk" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: "Warning: Inappropriate Comment",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#0a0a0a; margin:0; padding:0; font-family:system-ui;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#1a1a1a; border-radius:8px;">
              <tr><td style="text-align:center; padding:40px;">
                <h1 style="color:#f59e0b;">Comment Warning</h1>
              </td></tr>

              <tr><td style="padding:0 40px 40px;">
                <p style="color:#a1a1aa;">Hi ${name}, one of your comments was removed.</p>

                <div style="background:#2a2a2a; padding:20px; border-radius:6px; margin:20px 0;">
                  <p style="color:#d1d5db;">"${commentContent}"</p>
                  <p style="color:#9ca3af;">Reason: ${reason}</p>
                </div>

                <p style="color:#a1a1aa;">Warnings: ${warningCount}</p>

                ${
                  warningCount >= 3
                    ? `<div style="background:#7f1d1d; padding:15px; border-radius:6px;"><p style="color:#fca5a5;">🚫 You are temporarily blocked.</p></div>`
                    : warningCount === 2
                    ? `<div style="background:#7f1d1d; padding:15px; border-radius:6px;"><p style="color:#fca5a5;">⚠️ One more violation may result in blocking.</p></div>`
                    : ""
                }
              </td></tr>

              <tr><td style="padding:20px; background:#0a0a0a; text-align:center;">
                <p style="color:#52525b; font-size:12px;">This is an automated email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/* ===============================================================
   SEND BLOCK NOTIFICATION EMAIL
================================================================ */
export const sendBlockNotificationEmail = async (email, name, blockDuration, reason, isPermanent = false) => {
  const transporter = await getTransporter();

  const blockDescription = isPermanent
    ? "permanently blocked"
    : `temporarily blocked until ${new Date(blockDuration).toLocaleString()}`;

  const mailOptions = {
    from: `"The Band of the Hawk" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: "Account Block Notification",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#0a0a0a; margin:0; padding:0; font-family:system-ui;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#1a1a1a; border-radius:8px;">
              <tr><td style="padding:40px; text-align:center;">
                <h1 style="color:#ef4444;">Account ${isPermanent ? "Permanently" : "Temporarily"} Blocked</h1>
              </td></tr>

              <tr><td style="padding:0 40px 40px;">
                <p style="color:#a1a1aa;">Hi ${name}, your account has been ${blockDescription}.</p>

                <div style="background:#2a2a2a; padding:20px; border-radius:6px;">
                  <p style="color:#d1d5db;">Reason: ${reason}</p>
                </div>

                ${
                  isPermanent
                    ? `<div style="background:#7f1d1d; padding:15px; border-radius:6px; margin-top:20px;">
                        <p style="color:#fca5a5;">🚫 Your account is permanently blocked.</p>
                      </div>`
                    : `<div style="background:#7c2d12; padding:15px; border-radius:6px; margin-top:20px;">
                        <p style="color:#fdba74;">⚠️ Your account will be unblocked automatically.</p>
                      </div>`
                }
              </td></tr>

              <tr><td style="padding:20px; background:#0a0a0a; text-align:center;">
                <p style="color:#52525b; font-size:12px;">This is an automated message.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/* ===============================================================
   DEFAULT EXPORT
================================================================ */
export default getTransporter;
