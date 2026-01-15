import "dotenv/config";
import readline from "readline";
import { google } from "googleapis";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("Visit this URL to authorize:");
console.log(authUrl);

rl.question("Paste the authorization code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("REFRESH TOKEN:", tokens.refresh_token);
  } catch (error) {
    console.error("Error exchanging code:", error.response?.data || error);
  } finally {
    rl.close();
  }
});
