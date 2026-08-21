import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RECIPIENT_EMAIL = "kumaraman19137@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid name (at least 2 characters)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please write a message of at least 10 characters." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = (subject || "General Inquiry").trim();
    const cleanMessage = message.trim();
    const timestamp = new Date().toISOString();

    console.log(`[CONTACT DISPATCH] New message from ${cleanName} (${cleanEmail}) regarding "${cleanSubject}" at ${timestamp} -> To: ${RECIPIENT_EMAIL}`);

    // 2. Dispatch via configured provider or Webhook if present in env
    const resendApiKey = process.env.RESEND_API_KEY;
    const webhookUrl = process.env.CONTACT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Reader's HUB <onboarding@resend.dev>",
            to: [RECIPIENT_EMAIL],
            reply_to: cleanEmail,
            subject: `[Reader's HUB] ${cleanSubject} — from ${cleanName}`,
            text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\nDate: ${timestamp}\n\nMessage:\n${cleanMessage}`,
          }),
        });

        if (!resendRes.ok) {
          const errData = await resendRes.text();
          console.warn("[CONTACT] Resend delivery returned warning:", errData);
        }
      } catch (err: any) {
        console.warn("[CONTACT] Resend fetch exception:", err?.message || err);
      }
    }

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `📬 **New Reader's HUB Message**\n**From:** ${cleanName} (<${cleanEmail}>)\n**Topic:** ${cleanSubject}\n**Message:**\n${cleanMessage}`,
          }),
        });
      } catch (err: any) {
        console.warn("[CONTACT] Webhook notification warning:", err?.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Thank you, ${cleanName}! Your message has been sent directly to Aman Dubey (${RECIPIENT_EMAIL}).`,
      recipient: RECIPIENT_EMAIL,
      timestamp,
    });
  } catch (error: any) {
    console.error("[CONTACT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected server error occurred while sending your note. Please try again or email kumaraman19137@gmail.com directly.",
      },
      { status: 500 }
    );
  }
}

