import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to handle audio file uploads in base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Gemini Client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Helper to perform text generation with fallback models and retry backoffs
async function generateWithFallback(params: {
  contents: any[];
  config?: any;
}) {
  const client = getGeminiClient();
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    // Retry up to 2 times for each model if we get a transient error (e.g. 503, 429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Querying Gemini using model: ${model} (attempt ${attempt}/2)...`);
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMessage = typeof err === "object" ? (err?.message || JSON.stringify(err)) : String(err);
        const isTransient = errorMessage.includes("503") || 
                            errorMessage.includes("demand") || 
                            errorMessage.includes("UNAVAILABLE") || 
                            errorMessage.includes("429") || 
                            errorMessage.includes("RESOURCE_EXHAUSTED");

        console.warn(`Attempt ${attempt} failed with model ${model}:`, errorMessage);

        if (!isTransient) {
          // Non-transient error (validation, etc.), move on or throw
          break; 
        }

        // Wait with a small backoff delay before retrying
        if (attempt < 2) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to respond.");
}

// 1. Transcription Route - Handles base64 audio and transcribes/translates it via gemini-3.5-flash/fallbacks
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audio, mimeType, targetLanguage, audioTask } = req.body;

    if (!audio || !mimeType) {
      return res.status(400).json({ error: "Missing audio base64 data or mimeType" });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audio,
      },
    };

    let prompt = "Provide a clean, precise, and highly accurate transcript of this audio. Include proper capitalization, spelling, grammar, and punctuation. Do not add any introductory text, filler comments, conversational preamble, brackets, or notes like 'Here is your transcript:'—ONLY output the direct spoken text.";

    if (audioTask === "translate" && targetLanguage) {
      prompt = `Transcribe the following audio and translate it completely into ${targetLanguage}. Maintain the formatting, tone, and emotions. Return ONLY the translated text in ${targetLanguage}. Do not output any preamble, extra meta text, notes, or explanations.`;
    }

    const response = await generateWithFallback({
      contents: [audioPart, { text: prompt }]
    });

    const resultText = response.text || "";
    res.json({ text: resultText.trim() });
  } catch (error: any) {
    console.error("Error in /api/transcribe:", error);
    res.status(500).json({ error: error?.message || "Failed to process audio via AI." });
  }
});

// 2. Transcripts AI Processing (Punctuate, Translate, Summarize, Rewrite)
app.post("/api/process-text", async (req, res) => {
  try {
    const { text, mode, targetLanguage, tone } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing transcript text" });
    }

    let systemInstruction = "You are an expert multilingual linguistic AI processor. Perform the requested operation with surgical precision and return ONLY the resulting text with no extra introduction, explanation, markdown containers (such as ```), or meta comments.";
    let prompt = "";

    switch (mode) {
      case "translate":
        prompt = `Translate the following speech transcript fully and naturally into ${targetLanguage || "English"}. Translate it directly. Output ONLY the translation:\n\n${text}`;
        break;

      case "summarize":
        prompt = `Provide a concise, executive summary of the key ideas in the following transcription. Format with standard line spacing and bold key elements if helpful:\n\n${text}`;
        break;

      case "polish":
        prompt = `Polish this live speech transcript. Correct any verbal stumbles, stuttering, filler words (like 'um', 'uh', 'like', 'you know'), spelling mistakes, or false starts. Format it with clean paragraphs, adding appropriate punctuation and sentence structures while strictly preserving all original meaning:\n\n${text}`;
        break;

      case "extract-notes":
        prompt = `Transform the following spoken transcript into a neat list of action items, core topics discussed, and notable bullet points. Output only the organized bullet points:\n\n${text}`;
        break;

      case "rewrite":
        prompt = `Rewrite and rephrase the following speech transcript to have a highly ${tone || "professional"} tone. Ensure superb phrasing and professional diction:\n\n${text}`;
        break;

      default:
        prompt = `Add clean capitalization, formatting, and correct punctuation to this transcript:\n\n${text}`;
    }

    const response = await generateWithFallback({
      contents: [prompt],
      config: {
        systemInstruction,
      },
    });

    const resultText = response.text || "";
    res.json({ text: resultText.trim() });
  } catch (error: any) {
    console.error("Error in /api/process-text:", error);
    res.status(500).json({ error: error?.message || "AI processing failed." });
  }
});

// Serve Frontend using Vite Dev Server in development or Static Assets in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
