const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { neon } = require("@neondatabase/serverless");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const app = express();

const JWT_SECRET =
  process.env.JWT_SECRET || "resumeai_super_secret_key_2026";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
}

const sql = neon(process.env.DATABASE_URL);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// DATABASE INIT
// ==========================================

async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Neon PostgreSQL Connected");
    console.log("Users table ready");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

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

app.get("/api/test", async (req, res) => {
  try {
    await sql`SELECT 1`;

    res.json({
      success: true,
      message: "ResumeAI API is working ✅",
      database: "Neon PostgreSQL connected",
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

// ==========================================
// SIGNUP
// ==========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    const existingUser = await sql`
      SELECT id
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (name, email, password)
      VALUES (
        ${cleanName},
        ${cleanEmail},
        ${hashedPassword}
      )
      RETURNING id, name, email
    `;

    const user = result[0];

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

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await sql`
      SELECT id, name, email, password
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

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
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// ==========================================
// CURRENT USER
// ==========================================

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No authentication token.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ${decoded.userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: result[0],
    });
  } catch (error) {
    console.error(
      "Token verification error:",
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
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume.",
        });
      }

      console.log(
        "Resume:",
        req.file.originalname
      );

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: "GEMINI_API_KEY is missing.",
        });
      }

      const extension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      let resumeText = "";

      // ======================================
      // PDF
      // ======================================

      if (extension === "pdf") {
        const data = await pdfParse(
          req.file.buffer
        );

        resumeText = data.text;
      }

      // ======================================
      // DOCX
      // ======================================

      else if (extension === "docx") {
        const data =
          await mammoth.extractRawText({
            buffer: req.file.buffer,
          });

        resumeText = data.value;
      }

      // ======================================
      // INVALID FILE
      // ======================================

      else {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF and DOCX files are supported.",
        });
      }

      // ======================================
      // CLEAN TEXT
      // ======================================

      resumeText = resumeText
        .replace(/\s+/g, " ")
        .trim();

      if (resumeText.length < 30) {
        return res.status(400).json({
          success: false,
          message:
            "Could not read enough text from this resume.",
        });
      }

      // ======================================
      // JOB DESCRIPTION
      // ======================================

      const jobDescription =
        req.body.jobDescription?.trim() ||
        "Not provided";

      // ======================================
      // GEMINI
      // ======================================

      const genAI =
        new GoogleGenerativeAI(
          process.env.GEMINI_API_KEY
        );

      const model =
        genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
        });

      // ======================================
      // PROMPT
      // ======================================

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

      // ======================================
      // AI REQUEST
      // ======================================

      const result =
        await model.generateContent(
          prompt
        );

      const response =
        await result.response;

      let aiText = response.text();

      // ======================================
      // CLEAN AI RESPONSE
      // ======================================

      aiText = aiText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // ======================================
      // PARSE JSON
      // ======================================

      let analysis;

      try {
        analysis = JSON.parse(aiText);
      } catch (error) {
        console.error(
          "Invalid Gemini JSON:",
          aiText
        );

        return res.status(500).json({
          success: false,
          message:
            "Gemini returned an invalid analysis response.",
        });
      }

      // ======================================
      // SCORE VALIDATION
      // ======================================

      const scoreFields = [
        "atsScore",
        "skillsMatch",
        "keywords",
        "format",
        "experience",
        "education",
      ];

      scoreFields.forEach((field) => {
        let value = Number(
          analysis[field]
        );

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

      // ======================================
      // ARRAY VALIDATION
      // ======================================

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

      // ======================================
      // RESPONSE
      // ======================================

      return res.json({
        success: true,
        fileName:
          req.file.originalname,
        analysis,
      });
    } catch (error) {
      console.error(
        "ANALYSIS ERROR:",
        error
      );

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
// MULTER ERROR HANDLER
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
// 404
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
      "Server error:",
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
// VERCEL EXPORT
// ==========================================

module.exports = app;

// ==========================================
// LOCAL SERVER
// ==========================================

if (require.main === module) {
  const PORT =
    process.env.PORT || 5000;

  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log("");
      console.log(
        "================================="
      );
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
      console.log(
        "================================="
      );
    });
  });
}