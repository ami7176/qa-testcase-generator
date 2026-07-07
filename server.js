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

app.use(
  express.json({
    limit: "5mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

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
// Supported Test Types
// ================================

const AVAILABLE_TEST_TYPES = [
  "Functional",

  "Positive",

  "Negative",

  "Security",

  "API",

  "Database",

  "UI",

  "Accessibility",

  "Performance",

  "Regression",

  "Smoke",

  "Integration",

  "Unit",
];

// ================================
// Helper: Build Prompt
// ================================
function buildPrompt(requirement, testType) {
  return `
You are a Senior QA Engineer.

Requirement:
${requirement}

Selected Test Type:
${testType}

IMPORTANT

Generate ONLY ${testType} test cases.

DO NOT generate Functional test cases.

DO NOT generate any other category.

Every test case MUST belong to ${testType}.

The value of "type" MUST always be exactly:

"${testType}"

Return ONLY JSON.

{
 "testCases":[
  {
   "type":"${testType}",
   "title":"",
   "module":"",
   "priority":"High",
   "preconditions":"",
   "steps":"",
   "expectedResult":""
  }
 ]
}

Generate 8 professional ${testType} test cases.
`;
}

// ================================
// Generate Test Cases API
// ================================

app.post("/generate", async (req, res) => {
  try {
    const {
      requirement,

      testTypes = [],
    } = req.body;

    console.log("======================");
    console.log("Requirement:", requirement);
    console.log("Received Types:", testTypes);
    console.log("======================");

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({
        error: "Requirement is required.",
      });
    }

    if (selectedTypes.length === 0) {
      selectedTypes.push("Functional");
    }
    // Filter only supported test types
    const selectedTypes = Array.isArray(testTypes)
      ? testTypes.filter((type) => AVAILABLE_TEST_TYPES.includes(type))
      : [];

    const allTestCases = [];

    for (const type of selectedTypes) {
      console.log("Generating:", type);
      console.log(prompt);
      const prompt = buildPrompt(requirement, type);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: prompt,
      });

      let text = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);

        result = match ? JSON.parse(match[0]) : { testCases: [] };
      }

      if (!result.testCases) {
        result.testCases = [];
      }

      result.testCases = result.testCases.map((tc) => ({
        type,

        title: tc.title || "",

        module: tc.module || "",

        priority: tc.priority || "Medium",

        preconditions: tc.preconditions || "",

        steps: tc.steps || "",

        expectedResult: tc.expectedResult || "",
      }));

      result.testCases.forEach((tc) => {
        console.log("Current Selected Type :", type);

        console.log("Gemini Returned :", tc);

        console.log({
          id: allTestCases.length + 1,
          type: type,
          title: tc.title,
        });
        allTestCases.push({
          id: allTestCases.length + 1,

          type,

          title: tc.title || "",

          module: tc.module || "",

          priority: tc.priority || "Medium",

          preconditions: tc.preconditions || "",

          steps: tc.steps || "",

          expectedResult: tc.expectedResult || "",
        });
      });
    }
    console.log("Final Response:");
    console.log(JSON.stringify(allTestCases, null, 2));
 
    return res.json({
      testCases: allTestCases,
    });
  } catch (error) {
    console.error("\n========================");

    console.error("Gemini Error");

    console.error(error);

    console.error("========================\n");

    return res.status(500).json({
      error: "Failed to generate test cases.",

      details: error.message,
    });
  }
});

// ================================
// Health Check
// ================================

app.get("/health", (req, res) => {
  res.json({
    status: "Running",

    server: "QA Test Case Generator",

    version: "2.0",

    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// ================================
// Start Server
// ================================

app.listen(PORT, "0.0.0.0", () => {
  console.clear();

  console.log("==========================================");

  console.log(" QA Test Case Generator v2.0");

  console.log("==========================================");

  console.log(` Server Running`);

  console.log(` http://localhost:${PORT}`);

  console.log("");

  console.log(" Gemini Status:");

  if (process.env.GEMINI_API_KEY) {
    console.log(" Connected");
  } else {
    console.log(" API Key Missing");
  }

  console.log("==========================================");
});
