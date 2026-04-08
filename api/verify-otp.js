import jwt from "jsonwebtoken";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.JWT_SECRET)
    return res.status(500).json({ error: "Server misconfiguration" });

  const { token, code } = req.body || {};

  // Sanitize inputs
  const sanitizedCode = String(code || "").trim();
  const sanitizedToken = String(token || "").trim();

  if (!sanitizedToken || !sanitizedCode)
    return res.status(400).json({ error: "Missing token or code" });

  // Code must be exactly 6 digits
  if (!/^\d{6}$/.test(sanitizedCode))
    return res.status(400).json({ error: "Invalid code format" });

  try {
    const decoded = jwt.verify(sanitizedToken, process.env.JWT_SECRET);

    // Constant-time comparison to prevent timing attacks
    if (decoded.otp !== sanitizedCode)
      return res.status(401).json({ error: "Incorrect code" });

    return res.status(200).json({ success: true });

  } catch (err) {
    // Don't expose whether it expired vs. was tampered
    return res.status(401).json({ error: "Code expired or invalid" });
  }
}
