import jwt from "jsonwebtoken";

const DEMO_JWT_SECRET = "demo-secret-key";

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = readBody(req);
    const sanitizedEmail = String(email || "").trim().toLowerCase();

    if (!sanitizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Use the configured secret when available, otherwise use a demo fallback
    // so the login flow does not crash during debugging.
    const JWT_SECRET = process.env.JWT_SECRET || DEMO_JWT_SECRET;

    const token = jwt.sign(
      { email: sanitizedEmail, otp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const brevoKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "a77292001@smtp-brevo.com";

    // In demo/debug mode, Brevo is optional.
    // If no key is configured, skip email sending and still return a valid token.
    if (!brevoKey) {
      console.warn("[send-otp] BREVO_API_KEY missing; skipping email send (demo mode).");
      return res.status(200).json({
        token,
        mode: "demo",
        message: "OTP generated locally; email sending skipped."
      });
    }

    // If fetch is unavailable in the runtime, fail gracefully instead of throwing a 500.
    if (typeof fetch !== "function") {
      console.warn("[send-otp] fetch is unavailable; skipping email send.");
      return res.status(200).json({
        token,
        mode: "demo",
        message: "OTP generated locally; email sending skipped."
      });
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "Axiom", email: senderEmail },
          to: [{ email: sanitizedEmail }],
          subject: "Axiom: Security Verification",
          htmlContent: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;background:#1A1D21;color:#E8EAF0;padding:32px;border-radius:14px;border:1px solid #2C3039">
              <h2 style="color:#A3D1C6;margin:0 0 16px 0">Axiom</h2>
              <p style="color:#7B8499;font-size:14px;margin-bottom:24px">Security code for <b>${sanitizedEmail}</b></p>
              <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#A3D1C6;background:#242830;padding:24px;border-radius:10px;text-align:center">
                ${otp}
              </div>
              <p style="color:#5C6475;font-size:11px;margin-top:24px">If you did not request this code, you can ignore this message.</p>
            </div>
          `
        })
      });

      if (!response.ok) {
        let details = null;
        try {
          details = await response.json();
        } catch {
          details = { error: "Brevo returned a non-JSON error response" };
        }

        console.error("[send-otp] Brevo error:", details);

        // Keep the flow alive for debugging/demo use.
        return res.status(200).json({
          token,
          mode: "demo",
          message: "OTP generated, but email delivery failed.",
          warning: "Brevo email delivery failed"
        });
      }
    } catch (emailErr) {
      console.error("[send-otp] Email send failed:", emailErr);
      return res.status(200).json({
        token,
        mode: "demo",
        message: "OTP generated, but email delivery failed.",
        warning: "Email send attempt failed"
      });
    }

    return res.status(200).json({
      token,
      mode: "email",
      message: "OTP sent successfully."
    });
  } catch (err) {
    console.error("[send-otp] Internal error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
}
