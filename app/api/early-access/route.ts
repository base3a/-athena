import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Graceful degradation: if Google Sheets isn't configured, log and succeed silently
    if (!serviceAccountEmail || !privateKey || !sheetId ||
        serviceAccountEmail.includes("your-service-account") ||
        sheetId === "your_google_sheet_id_here") {
      console.log(`[early-access] Google Sheets not configured — email captured: ${email}`);
      return NextResponse.json({ success: true });
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:B",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[email, new Date().toISOString()]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Early access submission error:", err);
    return NextResponse.json({ error: "Failed to save email." }, { status: 500 });
  }
}
