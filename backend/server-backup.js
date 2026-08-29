const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// ==========================================
// APP CONFIG
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "resumeai_super_secret_key_2026";

// ==========================================
// SQLITE DATABASE
// ==========================================

const db = new Database("resumeai.db");

db.pragma("journal_mode = WAL");

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

console.log("");
console.log("=================================");
console.log("✅ SQLite Database Connected");
console.log("📁 Database: resumeai.db");
console.log("=================================");

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// FILE UPLOAD
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are supported."));
    }
  },
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResumeAI Backend Running 🚀",
  });
});

// ==========================================
// API TEST
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working ✅",
  });
});

// ==========================================
// SIGNUP
// ==========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = db
      .prepare(
        "SELECT id FROM users WHERE email = ?"
      )
      .get(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Insert user
    const result = db
      .prepare(`
        INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)
      `)
      .run(
        cleanName,
        cleanEmail,
        hashedPassword
      );

    const userId = result.lastInsertRowid;

    // Generate JWT
    const token = jwt.sign(
      {
        userId: userId,
        email: cleanEmail,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      "✅ New user registered:",
      cleanEmail
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",

      token,

      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Signup failed.",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    // Find user
    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          password
        FROM users
        WHERE email = ?
      `)
      .get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check password
    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      "✅ User logged in:",
      user.email
    );

    return res.json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// ==========================================
// CURRENT USER
// ==========================================

app.get("/api/auth/me", (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No authentication token.",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "❌ Token verification error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

// ==========================================
// RESUME ANALYZER
// ==========================================

app.post(
  "/api/analyze",
  upload.single("resume"),
  async (req, res) => {
    try {
      console.log("");
      console.log("=================================");
      console.log("📄 Resume analysis started");
      console.log("=================================");

      // --------------------------------------
      // CHECK FILE
      // --------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume.",
        });
      }

      console.log(
        "📁 File:",
        req.file.originalname
      );

      console.log(
        "📦 Size:",
        req.file.size,
        "bytes"
      );

      // --------------------------------------
      // GEMINI API KEY
      // --------------------------------------

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "GEMINI_API_KEY is missing in .env",
        });
      }

      // --------------------------------------
      // FILE EXTENSION
      // --------------------------------------

      const extension =
        req.file.originalname
          .split(".")
          .pop()
          .toLowerCase();

      let resumeText = "";

      // --------------------------------------
      // PDF
      // --------------------------------------

      if (extension === "pdf") {
        console.log("📕 Reading PDF...");

        const data =
          await pdfParse(
            req.file.buffer
          );

        resumeText = data.text;
      }

      // --------------------------------------
      // DOCX
      // --------------------------------------

      else if (extension === "docx") {
        console.log("📘 Reading DOCX...");

        const data =
          await mammoth.extractRawText({
            buffer: req.file.buffer,
          });

        resumeText = data.value;
      }

      // --------------------------------------
      // INVALID FILE
      // --------------------------------------

      else {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF and DOCX files are supported.",
        });
      }

      // --------------------------------------
      // CLEAN TEXT
      // --------------------------------------

      resumeText = resumeText
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        "📝 Extracted characters:",
        resumeText.length
      );

      // --------------------------------------
      // CHECK TEXT
      // --------------------------------------

      if (resumeText.length < 30) {
        return res.status(400).json({
          success: false,
          message:
            "Could not read enough text from this resume. Please upload a text-based PDF or DOCX.",
        });
      }

      // --------------------------------------
      // JOB DESCRIPTION
      // --------------------------------------

      const jobDescription =
        req.body.jobDescription?.trim() ||
        "Not provided";

      // --------------------------------------
      // GEMINI
      // --------------------------------------

      console.log(
        "🤖 Connecting to Gemini..."
      );

      const genAI =
        new GoogleGenerativeAI(
          process.env.GEMINI_API_KEY
        );

      const model =
        genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
        });

      // --------------------------------------
      // PROMPT
      // --------------------------------------

      const prompt = `
You are a professional ATS Resume Analyzer.

Analyze the resume based ONLY on the actual resume content.

IMPORTANT RULES:

1. Do NOT use a fixed score.
2. Do NOT always return the same score.
3. Calculate scores based on the actual resume.
4. Scores must be realistic.
5. Return ONLY valid JSON.
6. Do NOT use markdown.
7. Do NOT use code fences.

Return exactly:

{
  "atsScore": 0,
  "skillsMatch": 0,
  "keywords": 0,
  "format": 0,
  "experience": 0,
  "education": 0,
  "summary": "",
  "strengths": [],
  "missingSkills": [],
  "suggestions": []
}

SCORING:

atsScore:
Overall ATS compatibility from 0-100.

skillsMatch:
Evaluate actual technical and professional skills.

keywords:
Evaluate relevant industry and job-related keywords.

format:
Evaluate resume structure, headings, readability and ATS friendliness.

experience:
Evaluate internships, projects, work experience and achievements.

education:
Evaluate education details and relevance.

Provide:

- 3 to 5 strengths
- 3 to 8 missing skills or keywords
- 3 to 5 useful suggestions

If a job description is provided,
compare the resume against it.

JOB DESCRIPTION:

${jobDescription}

RESUME:

${resumeText}
`;

      // --------------------------------------
      // SEND TO GEMINI
      // --------------------------------------

      console.log(
        "🚀 Sending resume to Gemini..."
      );

      const result =
        await model.generateContent(
          prompt
        );

      const response =
        await result.response;

      let aiText = response.text();

      console.log(
        "✅ Gemini response received"
      );

      // --------------------------------------
      // CLEAN RESPONSE
      // --------------------------------------

      aiText = aiText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // --------------------------------------
      // PARSE JSON
      // --------------------------------------

      let analysis;

      try {
        analysis = JSON.parse(aiText);
      } catch (jsonError) {
        console.error(
          "❌ Invalid Gemini JSON:"
        );

        console.error(aiText);

        return res.status(500).json({
          success: false,
          message:
            "Gemini returned an invalid analysis response.",
        });
      }

      // --------------------------------------
      // SCORE VALIDATION
      // --------------------------------------

      const scoreFields = [
        "atsScore",
        "skillsMatch",
        "keywords",
        "format",
        "experience",
        "education",
      ];

      scoreFields.forEach((field) => {
        let value =
          Number(analysis[field]);

        if (isNaN(value)) {
          value = 0;
        }

        value = Math.max(
          0,
          Math.min(100, value)
        );

        analysis[field] =
          Math.round(value);
      });

      // --------------------------------------
      // ARRAY VALIDATION
      // --------------------------------------

      if (
        !Array.isArray(
          analysis.strengths
        )
      ) {
        analysis.strengths = [];
      }

      if (
        !Array.isArray(
          analysis.missingSkills
        )
      ) {
        analysis.missingSkills = [];
      }

      if (
        !Array.isArray(
          analysis.suggestions
        )
      ) {
        analysis.suggestions = [];
      }

      // --------------------------------------
      // LOG RESULTS
      // --------------------------------------

      console.log(
        "🎯 ATS Score:",
        analysis.atsScore
      );

      console.log(
        "💻 Skills:",
        analysis.skillsMatch
      );

      console.log(
        "🔑 Keywords:",
        analysis.keywords
      );

      console.log(
        "📐 Format:",
        analysis.format
      );

      console.log(
        "================================="
      );

      console.log(
        "✅ Analysis completed"
      );

      console.log(
        "================================="
      );

      // --------------------------------------
      // RESPONSE
      // --------------------------------------

      return res.json({
        success: true,

        fileName:
          req.file.originalname,

        analysis,
      });
    } catch (error) {
      console.error("");
      console.error(
        "❌ ANALYSIS ERROR"
      );

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Resume analysis failed.",
      });
    }
  }
);

// ==========================================
// MULTER / FILE ERROR
// ==========================================

app.use(
  (error, req, res, next) => {
    if (
      error instanceof multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File size must be less than 5 MB.",
        });
      }
    }

    if (
      error.message ===
      "Only PDF and DOCX files are supported."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Server error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error.",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log(
    "🚀 ResumeAI Backend Running"
  );
  console.log(
    `🌐 http://localhost:${PORT}`
  );
  console.log(
    `🧪 http://localhost:${PORT}/api/test`
  );
  console.log(
    "🔐 POST /api/auth/signup"
  );
  console.log(
    "🔑 POST /api/auth/login"
  );
  console.log(
    "👤 GET /api/auth/me"
  );
  console.log(
    "📄 POST /api/analyze"
  );
  console.log("=================================");
  console.log("");
});