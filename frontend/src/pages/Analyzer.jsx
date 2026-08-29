import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analyzer.css";

function Analyzer() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (selectedFile) => {
    setError("");

    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    validateFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const analyzeResume = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      // IMPORTANT:
      // Relative API URL - works with the deployed Vercel frontend
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Analysis failed.");
      }

      localStorage.setItem(
        "resumeAnalysis",
        JSON.stringify(data)
      );

      navigate("/results");
    } catch (err) {
      console.error("Analyze error:", err);

      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <div className="analyzer-container">

        {/* HEADER */}
        <header className="analyzer-header">
          <div className="analyzer-badge">
            ✨ AI-POWERED ANALYSIS
          </div>

          <h1>
            Analyze Your <span>Resume</span>
          </h1>

          <p>
            Upload your resume and let AI analyze your ATS
            compatibility, skills, keywords and improvements.
          </p>
        </header>

        {/* MAIN CARD */}
        <div className="analyzer-card">

          {/* UPLOAD */}
          <label
            className={`upload-area ${
              dragActive ? "dragging" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              ☁️
            </div>

            <h3>
              {file
                ? "Resume Selected"
                : "Drag & drop your resume here"}
            </h3>

            <p>
              or{" "}
              <strong>
                click to browse files
              </strong>
            </p>

            <p className="upload-hint">
              PDF or DOCX • Maximum size: 5 MB
            </p>

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              hidden
            />
          </label>

          {/* FILE */}
          {file && (
            <div className="file-info">
              <div className="file-info-left">
                <div className="file-icon">
                  📄
                </div>

                <div className="file-details">
                  <strong>{file.name}</strong>

                  <span>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {" • "}
                    Ready to analyze
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="remove-file"
                onClick={() => {
                  setFile(null);
                  setError("");
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* JOB DESCRIPTION */}
          <div className="job-section">
            <div className="job-label-row">
              <label htmlFor="jobDescription">
                🎯 Job Description
              </label>

              <span>
                Optional
              </span>
            </div>

            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(e.target.value)
              }
              placeholder="Paste the job description here to get better keyword and skill matching..."
            />

            <small>
              💡 Adding a job description helps AI compare your
              resume with the role requirements.
            </small>
          </div>

          {/* ANALYZE BUTTON */}
          <button
            type="button"
            className="analyze-btn"
            onClick={analyzeResume}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing Resume...
              </>
            ) : (
              <>
                ✨ Analyze Resume with AI
                <span>→</span>
              </>
            )}
          </button>

          {/* TRUST */}
          <div className="analyzer-trust">
            <span>🔒 Secure</span>
            <span>⚡ AI Powered</span>
            <span>📊 ATS Analysis</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Analyzer;