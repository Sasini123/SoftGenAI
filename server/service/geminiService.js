const axios = require("axios");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
const apiBase = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const modelPath = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Streaming version of getGeminiResponse
async function streamGeminiResponse(message, onChunk, onComplete, onError) {
  if (!message || message.trim() === "") {
    onError("Message cannot be blank");
    return;
  }

  const url = `${apiBase}/${modelPath}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const payload = {
    contents: [
      {
        parts: [{ text: message }],
      },
    ],
  };

  const maxRetries = Number(process.env.GEMINI_MAX_RETRIES || 3);
  const baseDelayMs = Number(process.env.GEMINI_RETRY_BASE_MS || 500);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, payload, {
        headers: { 
          "Content-Type": "application/json",
        },
        responseType: 'stream',
        timeout: 60000
      });

      let buffer = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              if (jsonStr.trim() === '[DONE]') {
                onComplete();
                return;
              }
              
              const data = JSON.parse(jsonStr);
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                onChunk(text);
              }
            } catch (parseError) {
              // Skip malformed JSON chunks
              console.warn('Failed to parse SSE chunk:', parseError.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        onComplete();
      });

      response.data.on('error', (err) => {
        throw err;
      });

      return; // Success, exit retry loop

    } catch (error) {
      const status = (error.response && error.response.status) || 500;
      const msg = (error.response && error.response.data && error.response.data.error && error.response.data.error.message) || error.message;
      const shortMsg = extractShortMessage(msg);
      console.error("Gemini streaming error:", status, shortMsg);

      const shouldRetry = [429, 503, 502, 504].includes(status);
      const isLast = attempt === maxRetries;

      if (shouldRetry && !isLast) {
        const delay = Math.round(baseDelayMs * Math.pow(2, attempt) + Math.random() * 200);
        console.warn(`Retrying stream (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
        await sleep(delay);
        continue;
      }

      onError(`Gemini API error: ${status} - ${shortMsg}`);
      return;
    }
  }
}

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

  const maxRetries = Number(process.env.GEMINI_MAX_RETRIES || 3);
  const baseDelayMs = Number(process.env.GEMINI_RETRY_BASE_MS || 500);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      const status = (error.response && error.response.status) || 500;
      const msg = (error.response && error.response.data && error.response.data.error && error.response.data.error.message) || error.message;
      const shortMsg = extractShortMessage(msg);
      console.error("Gemini API error:", status, shortMsg);

      // Retry on rate limit/overloaded/transient server errors
      const shouldRetry = [429, 503, 502, 504].includes(status);
      const isLast = attempt === maxRetries;

      if (shouldRetry && !isLast) {
        const delay = Math.round(baseDelayMs * Math.pow(2, attempt) + Math.random() * 200);
        console.warn(`Retrying Gemini call (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms due to ${status}`);
        await sleep(delay);
        continue;
      }

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

      // If not retried or retries exhausted
      return `Gemini API error: ${status} - ${shortMsg}`;
    }
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

module.exports = { getGeminiResponse, streamGeminiResponse, listModels };
