// ================================
// QA Test Case Generator - server.js
// Gemini API Integration (Google GenAI)
// ================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
      "priority": "High/Medium/Low",
      "preconditions": "",
      "testData": "",
      "steps": "",
      "expectedResult": ""
    }
  ]
}

Rules:
- Cover positive + negative scenarios
- Keep steps clear and numbered
- Make titles concise
- Ensure high QA quality

Requirement:
"""${requirement}"""
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

        // Gemini 2.5 Flash call
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text;

        // Extract JSON safely
        let json;
        try {
            json = JSON.parse(text);
        } catch (err) {
            // fallback if model adds extra text
            const match = text.match(/\{[\s\S]*\}/);
            json = match ? JSON.parse(match[0]) : { testCases: [] };
        }

        res.json(json);

    } catch (error) {
        console.error("Error generating test cases:", error);

        res.status(500).json({
            error: "Failed to generate test cases",
            details: error.message
        });
    }
});

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});