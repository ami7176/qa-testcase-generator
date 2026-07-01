// ================================
// QA Test Case Generator - server.js
// Gemini API Integration (Google GenAI)
// ================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// Current Directory
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// Middleware
// ================================
app.use(cors());
app.use(express.json());

// Serve HTML/CSS/JS files
app.use(express.static(__dirname));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// Gemini AI Setup
// ================================
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// ================================
// Helper: Build Prompt
// ================================
function buildPrompt(requirement) {
    return `
You are a Senior QA Engineer.

Convert the following requirement into PROFESSIONAL TestLink-style test cases.

Return ONLY valid JSON in this format:

{
  "testCases": [
    {
      "id": 1,
      "title": "",
      "module": "",
      "priority": "High",
      "preconditions": "",
      "testData": "",
      "steps": "",
      "expectedResult": ""
    }
  ]
}

Rules:
- Cover positive and negative scenarios.
- Keep steps clear and numbered.
- Make titles concise.
- Return ONLY JSON.
- No markdown.
- No explanation.

Requirement:
${requirement}
`;
}

// ================================
// API: Generate Test Cases
// ================================
app.post("/generate", async (req, res) => {

    try {

        const { requirement } = req.body;

        if (!requirement) {
            return res.status(400).json({
                error: "Requirement is required"
            });
        }

        const prompt = buildPrompt(requirement);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const text = response.text;

        let json;

        try {

            json = JSON.parse(text);

        } catch {

            const match = text.match(/\{[\s\S]*\}/);

            json = match
                ? JSON.parse(match[0])
                : { testCases: [] };

        }

        res.json(json);

    } catch (error) {

        console.error("Gemini Error:", error);

        res.status(500).json({
            error: "Failed to generate test cases",
            details: error.message
        });

    }

});

// ================================
// Start Server
// ================================
app.listen(PORT, "0.0.0.0", () => {

    console.log("==================================");
    console.log("QA Test Case Generator Started");
    console.log(`Running on : http://localhost:${PORT}`);
    console.log("==================================");

});