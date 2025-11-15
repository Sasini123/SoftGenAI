const { getGeminiResponse, streamGeminiResponse, listModels } = require("../service/geminiService");

async function chat(req, res) {
  try {
    const { message, stream } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Field 'message' is required. Use {\"message\":\"Your prompt\"} as the JSON body.",
      });
    }

    // If streaming is requested
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      streamGeminiResponse(
        message.trim(),
        (chunk) => {
          // Send each chunk as SSE
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        },
        () => {
          // Complete
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        (error) => {
          // Error
          res.write(`data: ${JSON.stringify({ error })}\n\n`);
          res.end();
        }
      );
    } else {
      // Non-streaming (original behavior)
      const response = await getGeminiResponse(message.trim());
      res.json({ response });
    }
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
