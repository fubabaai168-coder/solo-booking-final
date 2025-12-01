// lib/google.ts
import { google } from 'googleapis';
import path from 'path';

const auth = new google.auth.GoogleAuth({
  keyFilename: path.join(process.cwd(), 'service-account.json'),
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

export const calendar = google.calendar({ version: 'v3', auth });
export const sheets = google.sheets({ version: 'v4', auth });
export { auth };