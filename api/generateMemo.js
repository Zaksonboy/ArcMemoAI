export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { recipient, amount, purpose } = req.body;

  if (!recipient || !amount || !purpose) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  const prompt = `
Generate a professional blockchain transaction memo.

Recipient: ${recipient}
Amount: ${amount} USDC
Purpose: ${purpose}

Return only the memo in this format:

Reference:
Recipient:
Amount:
Purpose:
Category:
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const memo =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate memo.";

    res.status(200).json({
      memo
    });

  } catch (error) {

    res.status(500).json({
      error: "Failed to generate memo."
    });

  }
}
