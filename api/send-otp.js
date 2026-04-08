import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!BREVO_API_KEY || !JWT_SECRET) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { email } = body || {};
  const sanitizedEmail = String(email || "").trim().toLowerCase();

  // Basic validation to ensure something was entered
  if (!sanitizedEmail) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  // The JWT still uses the 'sanitizedEmail' (the one typed in the form)
  // so the application state remains correct for the user profile.
  let token;
  try {
    token = jwt.sign(
      { email: sanitizedEmail, otp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
  } catch (err) {
    return res.status(500).json({ error: "Token generation failed" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Axiom", email: process.env.BREVO_SENDER_EMAIL || "a77292001@smtp-brevo.com" },
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
      const result = await response.json();
      console.error("Brevo error:", result);
      return res.status(500).json({ error: "Email delivery failed" });
    }

    return res.status(200).json({ token });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
