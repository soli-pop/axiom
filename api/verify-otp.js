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

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, code } = readBody(req);

    const sanitizedToken = String(token || "").trim();
    const sanitizedCode = String(code || "").trim();

    if (!sanitizedToken || !sanitizedCode) {
      return res.status(400).json({ error: "Missing token or code" });
    }

    if (!/^\d{6}$/.test(sanitizedCode)) {
      return res.status(400).json({ error: "Invalid code format" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || DEMO_JWT_SECRET;
    const decoded = jwt.verify(sanitizedToken, JWT_SECRET);

    if (String(decoded.otp) !== sanitizedCode) {
      return res.status(401).json({ error: "Incorrect code" });
    }

    return res.status(200).json({
      success: true,
      email: decoded.email
    });
  } catch (err) {
    console.error("[verify-otp] Internal error:", err);
    return res.status(401).json({
      error: "Code expired or invalid"
    });
  }
}
