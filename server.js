import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

console.log("GEMINI_API_KEY =", process.env.GEMINI_API_KEY ? "Co key" : "Khong co key");

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

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        detectedLanguage: "Other",
        translatedText: raw
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error("Translate error:", error.message);
    res.status(500).json({
      error: error.message || "Loi translate"
    });
  }
});

app.post("/reply", async (req, res) => {
  try {
    const { text, targetLanguage, customerMessage } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Thieu text" });
    }

    const lang = targetLanguage || "English";

    const prompt = `
You are a native marketplace seller in Japan.

Write a natural customer reply in ${lang}.

Rules:
- Keep it short, friendly, and natural
- Sound like a real local chat message
- Keep all important details exact
- Do not explain anything
- Output only the final reply text

Customer's original message:
${customerMessage || ""}

Seller's Vietnamese reply:
${text}
`;

    const reply = await callGemini(prompt);

    res.json({ reply, targetLanguage: lang });
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