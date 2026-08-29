import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // IMPORTANT:
      // Relative API URL
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Account creation failed."
        );
      }

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        navigate("/");
      } else {
        navigate("/login");
      }

    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-container">

        {/* LEFT BRAND SECTION */}
        <div className="auth-showcase">

          <Link
            to="/"
            className="auth-brand"
          >
            <div className="auth-brand-icon">
              ✦
            </div>

            <span>
              ResumeAI
            </span>
          </Link>

          <div className="showcase-content">

            <div className="showcase-badge">
              AI-Powered Resume Analysis
            </div>

            <h1>
              Build a resume
              <span>
                {" "}that gets noticed.
              </span>
            </h1>

            <p>
              Analyze your resume with AI,
              discover improvement areas,
              and make your job application stronger.
            </p>

            <div className="showcase-features">

              <div className="showcase-feature">

                <div className="showcase-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    ATS Score
                  </strong>

                  <span>
                    Understand how recruiters see your resume.
                  </span>
                </div>

              </div>

              <div className="showcase-feature">

                <div className="showcase-icon">
                  ✦
                </div>

                <div>
                  <strong>
                    AI Insights
                  </strong>

                  <span>
                    Get practical suggestions for improvement.
                  </span>
                </div>

              </div>

              <div className="showcase-feature">

                <div className="showcase-icon">
                  ↗
                </div>

                <div>
                  <strong>
                    Job Ready
                  </strong>

                  <span>
                    Improve skills and keyword compatibility.
                  </span>
                </div>

              </div>

            </div>
          </div>

          <div className="showcase-footer">
            © 2026 ResumeAI · Smart Career Tools
          </div>

        </div>

        {/* SIGNUP SECTION */}
        <div className="auth-panel">

          <div className="auth-card">

            <div className="mobile-brand">

              <div className="auth-brand-icon">
                ✦
              </div>

              <span>
                ResumeAI
              </span>

            </div>

            <div className="auth-heading">

              <span className="auth-label">
                CREATE ACCOUNT
              </span>

              <h2>
                Start your journey
              </h2>

              <p>
                Create your free account and start improving your resume.
              </p>

            </div>

            {error && (
              <div className="auth-error">
                <span>!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* NAME */}
              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />

                </div>
              </div>

              {/* EMAIL */}
              <div className="form-group">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                  />

                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔐
                  </span>

                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />

                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            <div className="auth-divider">
              <span>
                Already have an account?
              </span>
            </div>

            <Link
              to="/login"
              className="auth-secondary-button"
            >
              Sign in to your account
            </Link>

            <p className="auth-security">
              🔐 Your data is securely handled.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Signup;