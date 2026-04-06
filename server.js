import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

console.log(
  "GEMINI_API_KEY =",
  process.env.GEMINI_API_KEY ? "Co key" : "Khong co key"
);

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.get("/test", (req, res) => {
  res.send("Route /test OK");
});

async function callGemini(prompt) {
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
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error(data?.error?.message || "Loi Gemini API");
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function cleanJsonFence(rawText) {
  return rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

app.post("/translate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Thieu text" });
    }

    const prompt = `
You are a translation assistant for a Vietnamese seller talking to customers in Japan.

Tasks:
1. Detect the customer's language from this text.
2. Translate it naturally into Vietnamese.
3. Return JSON only, no markdown, no explanation.

Language choices:
- Indonesian
- Tagalog
- English
- Japanese
- Other

Return exactly in this format:
{
  "detectedLanguage": "...",
  "translatedText": "..."
}

Customer message:
${text}
`;

    const raw = await callGemini(prompt);
    const cleaned = cleanJsonFence(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed. Raw Gemini output:", raw);
      parsed = {
        detectedLanguage: "Other",
        translatedText: cleaned
      };
    }

    res.json({
      detectedLanguage: parsed.detectedLanguage || "Other",
      translatedText: parsed.translatedText || ""
    });
  } catch (error) {
    console.error("Translate error:", error.message);
    res.status(500).json({
      error: error.message || "Loi translate"
    });
  }
});

app.post("/reply", async (req, res) => {
  try {
    const { sellerReplyVi, targetLanguage, customerMessage } = req.body;

    if (!sellerReplyVi || !sellerReplyVi.trim()) {
      return res.status(400).json({ error: "Thieu sellerReplyVi" });
    }

    const lang = targetLanguage || "English";

    let languageStyle = "";

    if (lang === "Tagalog") {
      languageStyle = `
Write like a real Filipino marketplace seller in Japan.
Prefer natural simple English mixed with light Tagalog only when it feels natural.
Do not overuse slang.
Sound friendly, warm, short, and clear.
`;
    } else if (lang === "Indonesian") {
      languageStyle = `
Write like a real Indonesian online seller chat.
Use natural Indonesian chat style, polite, short, and friendly.
Do not sound like machine translation.
`;
    } else if (lang === "Japanese") {
      languageStyle = `
Write in natural conversational Japanese for customer chat.
Be polite, short, and easy to understand.
`;
    } else {
      languageStyle = `
Write in simple natural English for marketplace chat.
Be short, friendly, and professional.
`;
    }

    const prompt = `
You are helping a Vietnamese seller in Japan reply naturally to customers.

${languageStyle}

Rules:
- This is a real sales chat reply
- Rewrite the seller's Vietnamese meaning into a natural message for the customer
- Keep all details exact: price, shipping fee, delivery time, payment method, product condition, warranty
- Keep it short and natural like a real person chatting
- Do not explain anything
- Do not translate word by word
- Do not sound robotic
- Output only the final message to send

Customer's latest message:
${customerMessage || ""}

Seller's intended Vietnamese reply:
${sellerReplyVi}
`;

    const reply = await callGemini(prompt);

    res.json({
      reply: reply.trim(),
      targetLanguage: lang
    });
  } catch (error) {
    console.error("Reply error:", error.message);
    res.status(500).json({
      error: error.message || "Loi reply"
    });
  }
});

app.listen(PORT, () => {
  console.log("Server chay tai http://localhost:" + PORT);
});