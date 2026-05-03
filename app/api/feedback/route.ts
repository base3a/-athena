import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { message, page } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json({ error: "Message too short." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.log("[feedback] RESEND_API_KEY not set — message:", message);
      return NextResponse.json({ success: true });
    }

    const to = process.env.FEEDBACK_TO_EMAIL ?? "hello@athenastock.net";

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "Athena Feedback <noreply@athenastock.net>",
      to,
      subject: "New Feedback — Athena",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid #1f1a0a;border-radius:16px;overflow:hidden;">
          <tr><td style="height:3px;background:linear-gradient(90deg,#d4a017 0%,#f0c040 50%,#a07810 100%);"></td></tr>
          <tr>
            <td align="center" style="padding:36px 40px 0;">
              <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#d4a017;">ATHENA</p>
              <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#555;">User Feedback</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px;">
              ${page ? `<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#555;">Page: ${page}</p>` : ""}
              <p style="margin:0 0 20px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#555;">Received: ${new Date().toUTCString()}</p>
              <div style="background:#111;border:1px solid #222;border-radius:10px;padding:20px 24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#e5e5e5;white-space:pre-wrap;">${message.trim()}</p>
              </div>
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback] error:", err);
    return NextResponse.json({ error: "Failed to send feedback." }, { status: 500 });
  }
}
