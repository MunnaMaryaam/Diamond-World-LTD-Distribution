import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

// AI Intelligence Endpoint for Movement Analysis
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { prompt, metricsContext } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Graceful analytical response if no API key provided yet
      return res.json({
        analysis: `### Movement Analysis AI Executive Summary
- **Distribution Balance**: Recommended transfers will effectively rebalance stock between high-performing retail hubs (such as Online, Chittagong, Dhanmondi) and saturated branches (Savar, Bashundhara).
- **Overstock Containment**: 51 units across branches with a 50.9% company sell-through rate indicate healthy baseline holding, but 12 units need procurement for high-demand non-transferrable SKUs (e.g. 0.24ct, 0.29ct, 1.00ct).
- **Action Priority**: Immediate dispatch of priority transfer slips will eliminate opportunity loss without requiring immediate capital deployment.`,
        isSimulated: true,
      });
    }

    const systemInstruction = `You are "Movement Analysis AI", an elite senior retail intelligence and diamond solitaire earring inventory distribution executive.
Analyze diamond solitaire earrings inventory movement, branch overstocks, shortage emergencies, weight velocities (carat weights), and transfer recommendations.
Provide sharp, quantitative, actionable retail intelligence with clear bullet points, risk flags, and transfer impact projections. Keep your tone executive, analytical, and professional.`;

    const fullPrompt = `${systemInstruction}

CONTEXT DATA:
${JSON.stringify(metricsContext, null, 2)}

USER QUESTION / TASK:
${prompt || "Generate a comprehensive movement analysis audit and retail redistribution recommendation report based on the provided branch sales, stock, and redistribution matrix."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
    });

    res.json({
      analysis: response.text,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI inventory analysis",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Movement Analysis AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
