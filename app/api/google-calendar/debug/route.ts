import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawGooglePrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const googlePrivateKey = rawGooglePrivateKey?.replace(/\\n/g, "\n");

  const configInfo = {
    hasServiceAccountEmail: !!serviceAccountEmail,
    serviceAccountEmail,
    hasRawPrivateKey: !!rawGooglePrivateKey,
    rawPrivateKeyLength: rawGooglePrivateKey ? rawGooglePrivateKey.length : 0,
    hasGooglePrivateKey: !!googlePrivateKey,
    googlePrivateKeyLength: googlePrivateKey ? googlePrivateKey.length : 0,
    calendarId,
  };

  try {
    if (!serviceAccountEmail || !googlePrivateKey || !calendarId) {
      return NextResponse.json(
        {
          ok: false,
          stage: "config",
          message: "Missing required env variables",
          configInfo,
        },
        { status: 500 }
      );
    }

    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: googlePrivateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    await jwtClient.authorize();

    const calendar = google.calendar({ version: "v3", auth: jwtClient });

    let calendarResult: any = null;
    try {
      const resp = await calendar.calendars.get({ calendarId });
      calendarResult = {
        ok: true,
        summary: resp.data.summary,
        id: resp.data.id,
      };
    } catch (err: any) {
      calendarResult = {
        ok: false,
        errorMessage: err?.errors?.[0]?.message || err?.message || "Unknown error",
        errorCode: err?.code,
        rawError: {
          code: err?.code,
          errors: err?.errors,
        },
      };
    }

    return NextResponse.json(
      {
        ok: true,
        stage: "google",
        configInfo,
        calendarResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GCalendar][DebugAPI][Error]", error);
    return NextResponse.json(
      {
        ok: false,
        stage: "unexpected",
        message: error?.message || "Unknown error",
        configInfo,
      },
      { status: 500 }
    );
  }
}

