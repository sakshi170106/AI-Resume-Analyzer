import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Results.css";

function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("resumeAnalysis");

    if (!saved) {
      navigate("/analyzer");
      return;
    }

    try {
      setData(JSON.parse(saved));
    } catch {
      navigate("/analyzer");
    }
  }, [navigate]);

  if (!data) {
    return (
      <div className="results-loading">
        Loading analysis...
      </div>
    );
  }

  const analysis = data.analysis || {};

  const score = Number(analysis.atsScore || 0);
  const skills = Number(analysis.skillsMatch || 0);
  const keywords = Number(analysis.keywords || 0);
  const format = Number(analysis.format || 0);
  const experience = Number(analysis.experience || 0);
  const education = Number(analysis.education || 0);

  const getScoreText = () => {
    if (score >= 85) return "Excellent Resume!";
    if (score >= 70) return "Good Resume!";
    if (score >= 55) return "Needs Improvement";
    return "Needs Major Improvement";
  };

  return (
    <div className="results-page">

      <div className="results-container">

        <button
          className="results-back"
          onClick={() => navigate("/analyzer")}
        >
          ← Analyze Another Resume
        </button>

        <header className="results-header">
          <span className="results-badge">
            ✨ AI Analysis Complete
          </span>

          <h1>Your Resume Results</h1>

          <p>
            AI-powered analysis of{" "}
            <strong>{data.fileName}</strong>
          </p>
        </header>

        {/* MAIN SCORE */}

        <section className="score-card">

          <div
  className="score-circle"
  style={{ "--score": score }}
>
            <div>
              <strong>{score}</strong>
              <span>/100</span>
            </div>
          </div>

          <div className="score-info">
            <span className="score-label">
              ATS SCORE
            </span>

            <h2>{getScoreText()}</h2>

            <p>
              {analysis.summary ||
                "Your resume has been analyzed using AI."}
            </p>
          </div>

        </section>

        {/* METRICS */}

        <section className="metrics-grid">

          <div className="metric-card">
            <span className="metric-icon">🎯</span>
            <strong>{skills}%</strong>
            <span>Skills Match</span>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🔑</span>
            <strong>{keywords}%</strong>
            <span>Keywords</span>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📄</span>
            <strong>{format}%</strong>
            <span>Format</span>
          </div>

          <div className="metric-card">
            <span className="metric-icon">💼</span>
            <strong>{experience}%</strong>
            <span>Experience</span>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🎓</span>
            <strong>{education}%</strong>
            <span>Education</span>
          </div>

        </section>

        {/* STRENGTHS */}

        <section className="result-section">

          <div className="section-heading">
            <span>💪</span>

            <div>
              <h2>Resume Strengths</h2>
              <p>What your resume is doing well</p>
            </div>
          </div>

          <div className="result-list">

            {(analysis.strengths || []).map(
              (item, index) => (
                <div className="result-item success" key={index}>
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              )
            )}

          </div>

        </section>

        {/* MISSING SKILLS */}

        <section className="result-section">

          <div className="section-heading">
            <span>🔍</span>

            <div>
              <h2>Missing Skills & Keywords</h2>
              <p>Consider adding these to improve your match</p>
            </div>
          </div>

          <div className="skills-list">

            {(analysis.missingSkills || []).map(
              (skill, index) => (
                <span className="skill-tag" key={index}>
                  {skill}
                </span>
              )
            )}

          </div>

        </section>

        {/* SUGGESTIONS */}

        <section className="result-section">

          <div className="section-heading">
            <span>💡</span>

            <div>
              <h2>AI Recommendations</h2>
              <p>Actionable improvements for your resume</p>
            </div>
          </div>

          <div className="recommendations">

            {(analysis.suggestions || []).map(
              (suggestion, index) => (
                <div
                  className="recommendation"
                  key={index}
                >
                  <span>{index + 1}</span>
                  <p>{suggestion}</p>
                </div>
              )
            )}

          </div>

        </section>

        {/* ACTION */}

        <div className="results-actions">

          <button
            onClick={() => navigate("/analyzer")}
            className="analyze-again"
          >
            🔄 Analyze Another Resume
          </button>

        </div>

      </div>
    </div>
  );
}

export default Results;