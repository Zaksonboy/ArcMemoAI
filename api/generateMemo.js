export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const { recipient, amount, purpose } = req.body;

  if (
    typeof recipient !== "string" ||
    typeof amount !== "string" ||
    typeof purpose !== "string" ||
    !recipient.trim() ||
    !amount.trim() ||
    !purpose.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: "Please complete all fields."
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

    if (!response.ok) {
      throw new Error("Gemini request failed.");
    }

    const result = await response.json();

    const memo =
      result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!memo) {
      throw new Error("No memo returned.");
    }

    return res.status(200).json({
      success: true,
      memo
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Unable to generate memo."
    });

  }
}
