const { getGeminiResponse, listModels } = require("../service/geminiService");

async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Field 'message' is required. Use {\"message\":\"Your prompt\"} as the JSON body.",
      });
    }
    const response = await getGeminiResponse(message.trim());
    res.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

async function getModels(req, res) {
  try {
    const models = await listModels();
    res.json(models);
  } catch (error) {
    console.error("List models error:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

function getConfig(req, res) {
  res.json({
    base: process.env.GEMINI_API_BASE || "(default)",
    model: process.env.GEMINI_MODEL || "(default)",
  });
}

module.exports = { chat, getModels, getConfig };
