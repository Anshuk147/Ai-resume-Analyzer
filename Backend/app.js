// server.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// ✅ Google Gemini Setup (2.5 SDK)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ✅ Analyze resume vs JD using Gemini
async function analyzeResumeWithJD(resumeText, jdText) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Compare the following resume and job description and tell what should be more refined.

Return this JSON format:
{
  "matchingSkills": [...],
  "missingSkills": [...],
  "overallMatchScore": <number from 0 to 100>,
  "summary": "<brief summary of match>"
}

Resume:
"""
${resumeText}
"""

Job Description:
"""
${jdText}
"""`,
            },
          ],
        },
      ],
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const text = response.text;

    // ✅ Safely extract JSON block only
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error("Gemini Error:", err);
    return {
      error: "Failed to parse Gemini JSON response",
      raw: err.message || String(err),
    };
  }
}


// ✅ POST: Upload Resume (PDF)
app.post("/upload", upload.single("resume"), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).send("No file uploaded.");
  if (file.mimetype !== "application/pdf")
    return res.status(400).send("Only PDF supported.");

  try {
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const sections = extractSections(text);
    fs.unlinkSync(file.path); // Cleanup

    res.json({
      text,
      sections,
    });
  } catch (error) {
    console.error("Resume parse error:", error);
    res.status(500).send("Failed to process resume");
  }
});

// ✅ POST: Upload JD Text
app.post("/upload-jd", express.json(), (req, res) => {
  const { jdText } = req.body;

  if (!jdText || jdText.trim().length === 0) {
    return res.status(400).json({ error: "Job description text is required." });
  }

  const sections = extractJDSections(jdText);
  res.json({
    message: "JD received successfully",
    jdText,
    sections,
  });
});

// ✅ POST: Match Resume & JD using Gemini
app.post("/match", async (req, res) => {
  const { resumeText, jdText } = req.body;

  if (!resumeText || !jdText) {
    return res
      .status(400)
      .json({ error: "resumeText and jdText are required." });
  }

  const result = await analyzeResumeWithJD(resumeText, jdText);

  if (result.error) {
    console.error("Gemini Match Error:", result.raw);
    return res.status(500).json(result); // ⛔ send error to frontend
  }

  // console.log("Gemini Match Result:", result);
  res.json(result); // ✅ send successful match data
});


// ✅ Resume Section Extractor (unchanged)
function extractSections(text) {
  const sectionMap = {};
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection = "Other";
  sectionMap[currentSection] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading =
      /^[A-Z][A-Za-z\s]{1,40}$/.test(line) &&
      !/[.?!]$/.test(line) &&
      line.split(" ").length <= 5;

    if (isHeading) {
      currentSection = line;
      if (!sectionMap[currentSection]) {
        sectionMap[currentSection] = [];
      }
    } else {
      sectionMap[currentSection].push(line);
    }
  }

  const result = {};
  for (const [section, contentLines] of Object.entries(sectionMap)) {
    result[section] = contentLines.join("\n");
  }

  return result;
}

// ✅ JD Section Extractor (unchanged)
function extractJDSections(jdText) {
  const lines = jdText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result = {
    overview: "",
    responsibilities: "",
    requirements: "",
    skills: [],
  };

  const lower = jdText.toLowerCase();

  if (lower.includes("responsibilities")) {
    const parts = jdText.split(/responsibilities[:\n]/i);
    result.responsibilities = parts[1]?.split(/requirements[:\n]/i)[0]?.trim();
  }

  if (lower.includes("requirements")) {
    const parts = jdText.split(/requirements[:\n]/i);
    result.requirements = parts[1]?.split(/skills[:\n]/i)[0]?.trim();
  }

  if (lower.includes("skills")) {
    const skills = jdText.split(/skills[:\n]/i)[1];
    result.skills = skills?.split(",").map((s) => s.trim());
  }

  return result;
}

// ✅ Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`the server is running on port number ${PORT}`);
});
