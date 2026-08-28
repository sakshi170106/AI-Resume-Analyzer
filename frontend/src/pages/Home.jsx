import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">

        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✦</span>
          <span>ResumeAI</span>
        </Link>

        <div className="navbar-links">

          <Link to="/" className="nav-link">
            Home
          </Link>

          <Link to="/analyzer" className="nav-link">
            Analyzer
          </Link>

          {user ? (
            /* ONLY SMALL PROFILE ICON */
            <Link to="/profile" className="profile-icon-link">
              <span className="navbar-profile">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="login-button">
                Login
              </Link>

              <Link to="/signup" className="signup-button">
                Get Started
              </Link>
            </>
          )}

        </div>
      </nav>


      {/* ================= HERO ================= */}
      <main className="hero">

        <div className="hero-content">

          <div className="badge">
            ✨ AI-Powered Resume AI
          </div>

          <h1>
            Build a resume that
            <span> gets noticed.</span>
          </h1>

          <p>
            Analyze your resume with AI and improve your ATS score.
            Get smarter insights, identify skill gaps and make your
            resume job-ready.
          </p>

          <div className="hero-buttons">

            <Link to="/analyzer" className="primary-btn">
              Analyze My Resume →
            </Link>

            {!user && (
              <Link to="/signup" className="secondary-btn">
                Get Started
              </Link>
            )}

          </div>

          <div className="trust">
            <span>✓ AI Powered</span>
            <span>✓ ATS Friendly</span>
            <span>✓ Easy to Use</span>
          </div>

        </div>


        {/* ================= ANALYSIS CARD ================= */}
        <div className="analysis-card">

          <div className="card-top">
            <span>RESUME ANALYSIS</span>
            <span className="green">● ANALYZED</span>
          </div>

          <h3>Overall Resume Score</h3>

          <div className="score">
            <strong>87</strong>
            <span>/100</span>
          </div>

          <h2>Great Resume!</h2>

          <p>Your resume has strong potential.</p>

          <div className="stats">

            <div>
              <strong>92%</strong>
              <span>ATS MATCH</span>
            </div>

            <div>
              <strong>24</strong>
              <span>KEYWORDS</span>
            </div>

            <div>
              <strong>8.7</strong>
              <span>QUALITY</span>
            </div>

          </div>

          <div className="tip">
            💡 Tip: Add more measurable achievements to make your
            resume stronger.
          </div>

        </div>

      </main>


      {/* ================= FEATURES ================= */}
      <section className="section">

        <div className="section-label">
          WHY RESUMEAI?
        </div>

        <h2>
          Everything you need to build a stronger resume.
        </h2>

        <p className="section-description">
          Use AI-powered insights to improve your resume and increase
          your chances of getting noticed.
        </p>

        <div className="features-grid">

          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>ATS Analysis</h3>
            <p>
              Understand how well your resume performs against
              Applicant Tracking Systems.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">🤖</div>
            <h3>AI Insights</h3>
            <p>
              Get intelligent suggestions to improve your resume
              content.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Skill Matching</h3>
            <p>
              Discover important skills and keywords missing from
              your resume.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>
              Analyze your resume quickly and get actionable
              feedback.
            </p>
          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section className="section" id="how-it-works">

        <div className="section-label">
          HOW IT WORKS
        </div>

        <h2>
          Improve your resume in three simple steps.
        </h2>

        <div className="steps">

          <div className="step">
            <span>01</span>
            <div className="step-icon">📄</div>
            <h3>Upload Resume</h3>
            <p>
              Upload your resume and let ResumeAI analyze it.
            </p>
          </div>

          <div className="step">
            <span>02</span>
            <div className="step-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>
              Our AI checks your resume for ATS, skills and content
              quality.
            </p>
          </div>

          <div className="step">
            <span>03</span>
            <div className="step-icon">🚀</div>
            <h3>Improve & Apply</h3>
            <p>
              Follow the recommendations and create a stronger
              resume.
            </p>
          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}
      <section className="cta">

        <div className="cta-icon">✦</div>

        <h2>
          Ready to improve your resume?
        </h2>

        <p>
          Get AI-powered feedback and make your resume stand out.
        </p>

        <Link to="/analyzer" className="primary-btn">
          Analyze My Resume →
        </Link>

      </section>


      {/* ================= FOOTER ================= */}
      <footer>

        <strong>✦ ResumeAI</strong>

        <p>
          AI-powered resume analysis for your career journey.
        </p>

        <small>
          © 2026 ResumeAI. All rights reserved.
        </small>

      </footer>

    </div>
  );
}

export default Home;