import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // ── 1. Save to Google Sheets (graceful degradation) ───────────────────
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (
      serviceAccountEmail &&
      privateKey &&
      sheetId &&
      !serviceAccountEmail.includes("your-service-account") &&
      sheetId !== "your_google_sheet_id_here"
    ) {
      try {
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
          requestBody: { values: [[email, new Date().toISOString()]] },
        });
      } catch (sheetErr) {
        // Don't fail the whole request if Sheets errors — email still captured
        console.error("[early-access] Google Sheets error:", sheetErr);
      }
    } else {
      console.log(`[early-access] Google Sheets not configured — email captured: ${email}`);
    }

    // ── 2. Send welcome email via Resend ──────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "Athena <noreply@athenastock.net>",
          to: email,
          subject: "Welcome to Athena — Your access is ready",
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Athena</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid #1f1a0a;border-radius:16px;overflow:hidden;">

          <!-- Header glow bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#d4a017 0%,#f0c040 50%,#a07810 100%);"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#d4a017;">ATHENA</p>
              <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#555;">AI-Powered Stock Analysis</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">Your access is ready.</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#999999;">
                Thanks for joining Athena. You now have full access to AI stock analysis.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#999999;">
                Enter any ticker to get institutional-grade fundamental analysis, risk assessment, and a clear AI investment verdict — in seconds.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:8px;background:linear-gradient(135deg,#d4a017 0%,#a07810 100%);">
                    <a href="https://athenastock.net" style="display:inline-block;padding:14px 36px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#000000;text-decoration:none;">
                      Start Analysing →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0;">
                <tr><td style="height:1px;background:#1a1a1a;"></td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                You're receiving this because you signed up at athenastock.net.<br />
                No credit card required &middot; 30 days full access.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `.trim(),
        });
        console.log(`[early-access] Welcome email sent to ${email}`);
      } catch (emailErr) {
        // Don't block success if email send fails
        console.error("[early-access] Resend error:", emailErr);
      }
    } else {
      console.log("[early-access] RESEND_API_KEY not set — skipping welcome email");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Early access submission error:", err);
    return NextResponse.json({ error: "Failed to save email." }, { status: 500 });
  }
}
