const axios = require("axios");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
const apiBase = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const modelPath = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";

async function getGeminiResponse(message) {
  if (!message || message.trim() === "") {
    return "Message cannot be blank";
  }

  const url = `${apiBase}/${modelPath}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [{ text: message }],
      },
    ],
  };

  try {
    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const candidates = res.data && res.data.candidates;
    if (candidates && candidates.length > 0) {
      const text = (candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0] && candidates[0].content.parts[0].text) || null;
      return text || "No text in Gemini response";
    }

    return "Empty response from Gemini API";
  } catch (error) {
    console.error("Gemini API error:", (error.response && error.response.data) || error.message);

    if (error.response && error.response.status === 404 && modelPath.includes("1.5")) {
      const fallback = "models/gemini-2.5-flash";
      console.warn(`Model '${modelPath}' not found. Trying fallback '${fallback}'`);
      try {
        const fbRes = await axios.post(
          `${apiBase}/${fallback}:generateContent?key=${apiKey}`,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );
        const fbText = fbRes.data && fbRes.data.candidates && fbRes.data.candidates[0] && fbRes.data.candidates[0].content && fbRes.data.candidates[0].content.parts && fbRes.data.candidates[0].content.parts[0] && fbRes.data.candidates[0].content.parts[0].text;
        return fbText || "No response (fallback)";
      } catch (inner) {
        console.error("Fallback failed:", inner.message);
        return "Fallback call failed";
      }
    }

    return `Gemini API error: ${((error.response && error.response.status) || 500)} - ${extractShortMessage((error.response && error.response.data && error.response.data.error && error.response.data.error.message) || error.message)}`;
  }
}

async function listModels() {
  const url = `${apiBase}/models?key=${apiKey}`;
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.error("Error listing models:", (error.response && error.response.data) || error.message);
    return `Error listing models: ${((error.response && error.response.status) || 500)}`;
  }
}

function extractShortMessage(msg) {
  if (!msg) return "";
  return msg.length > 120 ? msg.substring(0, 120) + "..." : msg;
}

module.exports = { getGeminiResponse, listModels };
