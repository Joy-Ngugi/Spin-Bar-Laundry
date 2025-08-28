// /api/sendBooking.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { name, phone, service, date, location } = req.body || {};
  if (!name || !phone || !service || !date || !location) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Build message
  const text =
    `📦 New Booking!\n\n` +
    `👤 Name: ${name}\n` +
    `📞 Phone: ${phone}\n` +
    `🛠 Service: ${service}\n` +
    `📅 Date: ${date}\n` +
    `📍 Location: ${location}`;

  try {
    // Environment variables (set these in Vercel → Project → Settings → Environment Variables)
    const token = process.env.WHATSAPP_TOKEN;                // Permanent access token
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;     // WhatsApp Phone Number ID
    const toNumber = process.env.WHATSAPP_TO;                // Your WhatsApp number, e.g., "2547XXXXXXXX" (no +)

    if (!token || !phoneNumberId || !toNumber) {
      return res.status(500).json({ success: false, error: "Server not configured" });
    }

    // WhatsApp Cloud API endpoint (version may change; this works with current versions)
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const waRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: text }
      }),
    });

    const waJson = await waRes.json();

    if (!waRes.ok) {
      // Log the WhatsApp API error for debugging
      console.error("WhatsApp API error:", waJson);
      return res.status(waRes.status).json({ success: false, error: waJson });
    }

    return res.status(200).json({ success: true, messageId: waJson.messages?.[0]?.id || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
