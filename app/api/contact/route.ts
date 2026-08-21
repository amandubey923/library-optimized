import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const RECIPIENT_EMAIL = "kumaraman19137@gmail.com";

interface ContactRequestBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactRequestBody = await req.json();
    const { name, email, subject, message } = body;

    // 1. Strict Input Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name (at least 2 characters)." },
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
    const cleanSubject = (subject || "Book Recommendation / General Inquiry").trim();
    const cleanMessage = message.trim();
    const timestamp = new Date().toLocaleString("en-US", { timeZoneName: "short" });

    // Environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM_EMAIL || "Reader's HUB <onboarding@resend.dev>";
    
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || "no-reply@readershub.app";

    const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY;
    const formspreeId = process.env.FORMSPREE_ID;

    let deliveryAttempted = false;
    let deliverySuccess = false;
    let providerUsed = "";

    // -------------------------------------------------------------
    // OPTION 1: Resend API
    // -------------------------------------------------------------
    if (resendApiKey) {
      deliveryAttempted = true;
      providerUsed = "Resend API";

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [RECIPIENT_EMAIL],
            reply_to: cleanEmail,
            subject: `[Reader's HUB] ${cleanSubject} — from ${cleanName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 10px;">
                <h2 style="color: #f59e0b; margin-top: 0;">📬 New Reader's HUB Message</h2>
                <hr style="border: 0; border-top: 1px solid #eaeaea;" />
                <p><strong>From:</strong> ${cleanName} (&lt;<a href="mailto:${cleanEmail}">${cleanEmail}</a>&gt;)</p>
                <p><strong>Topic:</strong> ${cleanSubject}</p>
                <p><strong>Date:</strong> ${timestamp}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #f59e0b; border-radius: 4px;">
                  <h4 style="margin-top: 0; color: #333;">Message:</h4>
                  <p style="white-space: pre-wrap; color: #444; line-height: 1.6;">${cleanMessage}</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
                <p style="font-size: 12px; color: #888;">This email was sent from the Reader's HUB Contact Form.</p>
              </div>
            `,
            text: `From: ${cleanName} (${cleanEmail})\nTopic: ${cleanSubject}\nDate: ${timestamp}\n\nMessage:\n${cleanMessage}`,
          }),
        });

        if (resendRes.ok) {
          deliverySuccess = true;
        } else {
          const errText = await resendRes.text();
          console.error("[CONTACT ERROR: Resend]", errText);
          throw new Error(`Resend service error: ${errText}`);
        }
      } catch (err: any) {
        console.error("[CONTACT EXCEPTION: Resend]", err?.message || err);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to deliver email via Resend: ${err?.message || "Unknown error"}. Please configure your API key or email directly to ${RECIPIENT_EMAIL}.`,
          },
          { status: 502 }
        );
      }
    }

    // -------------------------------------------------------------
    // OPTION 2: SMTP Transport (Gmail / Custom SMTP)
    // -------------------------------------------------------------
    else if (smtpUser && smtpPass) {
      deliveryAttempted = true;
      providerUsed = "SMTP Transport";

      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Reader's HUB" <${smtpFrom}>`,
          to: RECIPIENT_EMAIL,
          replyTo: `"${cleanName}" <${cleanEmail}>`,
          subject: `[Reader's HUB] ${cleanSubject} — from ${cleanName}`,
          text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\nDate: ${timestamp}\n\nMessage:\n${cleanMessage}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea;">
              <h2 style="color: #f59e0b;">📬 New Message via Reader's HUB</h2>
              <p><strong>Sender:</strong> ${cleanName} (&lt;${cleanEmail}&gt;)</p>
              <p><strong>Subject:</strong> ${cleanSubject}</p>
              <p><strong>Received:</strong> ${timestamp}</p>
              <div style="margin-top: 15px; padding: 15px; background: #fdfbf7; border-left: 4px solid #f59e0b;">
                <p style="white-space: pre-wrap; line-height: 1.6;">${cleanMessage}</p>
              </div>
            </div>
          `,
        });

        deliverySuccess = true;
      } catch (err: any) {
        console.error("[CONTACT EXCEPTION: SMTP]", err);
        return NextResponse.json(
          {
            success: false,
            error: `SMTP delivery failed: ${err?.message || "Authentication/Connection error"}. Please check your SMTP settings or email ${RECIPIENT_EMAIL} directly.`,
          },
          { status: 502 }
        );
      }
    }

    // -------------------------------------------------------------
    // OPTION 3: Web3Forms / Formspree API
    // -------------------------------------------------------------
    else if (web3FormsKey) {
      deliveryAttempted = true;
      providerUsed = "Web3Forms";

      try {
        const web3Res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: web3FormsKey,
            name: cleanName,
            email: cleanEmail,
            subject: `[Reader's HUB] ${cleanSubject} — from ${cleanName}`,
            message: cleanMessage,
            to: RECIPIENT_EMAIL,
          }),
        });

        const web3Data = await web3Res.json();
        if (web3Data.success) {
          deliverySuccess = true;
        } else {
          throw new Error(web3Data.message || "Web3Forms submission failed");
        }
      } catch (err: any) {
        console.error("[CONTACT EXCEPTION: Web3Forms]", err);
        return NextResponse.json(
          {
            success: false,
            error: `Web3Forms delivery failed: ${err?.message || "Unknown error"}.`,
          },
          { status: 502 }
        );
      }
    } else if (formspreeId) {
      deliveryAttempted = true;
      providerUsed = "Formspree";

      try {
        const formspreeRes = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            _subject: `[Reader's HUB] ${cleanSubject} — from ${cleanName}`,
            message: cleanMessage,
          }),
        });

        if (formspreeRes.ok) {
          deliverySuccess = true;
        } else {
          const errData = await formspreeRes.json();
          throw new Error(errData?.error || "Formspree submission failed");
        }
      } catch (err: any) {
        console.error("[CONTACT EXCEPTION: Formspree]", err);
        return NextResponse.json(
          {
            success: false,
            error: `Formspree delivery failed: ${err?.message || "Unknown error"}.`,
          },
          { status: 502 }
        );
      }
    }

    // -------------------------------------------------------------
    // NO EMAIL PROVIDER CONFIGURED
    // -------------------------------------------------------------
    if (!deliveryAttempted) {
      console.warn(
        `[CONTACT WARNING] No email provider configured in environment variables (RESEND_API_KEY, SMTP_USER/SMTP_PASS, or WEB3FORMS_ACCESS_KEY). Logged message from ${cleanName} (${cleanEmail}) to ${RECIPIENT_EMAIL}`
      );

      return NextResponse.json(
        {
          success: false,
          isUnconfigured: true,
          error: `Email service is not yet linked in environment variables (RESEND_API_KEY, SMTP_USER, or WEB3FORMS_ACCESS_KEY). Please click "Send via Mail Client" below to email Aman Dubey directly at ${RECIPIENT_EMAIL}.`,
          recipient: RECIPIENT_EMAIL,
          fallbackMailto: `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(`[Reader's HUB] ${cleanSubject}`)}&body=${encodeURIComponent(`Name: ${cleanName}\nEmail: ${cleanEmail}\n\n${cleanMessage}`)}`,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Your message has been sent to Aman Dubey (${RECIPIENT_EMAIL}).`,
      provider: providerUsed,
      timestamp,
    });
  } catch (error: any) {
    console.error("[CONTACT FATAL ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected server error occurred. Please try again or email kumaraman19137@gmail.com directly.",
      },
      { status: 500 }
    );
  }
}
