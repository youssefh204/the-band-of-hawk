import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ⬇️ PASTE YOUR CODE HERE
const code = "4/0Ab32j90GK1IlnjMdP7duyQ4PrFc2w3IhqNSoFsvWKSFLfSInWUS-pSVWWoo6soQvVXVBCA";

async function main() {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("ACCESS TOKEN:", tokens.access_token);
    console.log("REFRESH TOKEN:", tokens.refresh_token);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
