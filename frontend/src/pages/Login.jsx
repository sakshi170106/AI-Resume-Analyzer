import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
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

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Save authentication information
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to home page
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background Decorations */}
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <div className="auth-container">

        {/* Left Side */}
        <div className="auth-showcase">

          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon">
              ✦
            </div>

            <span>Resume Analyzer</span>
          </Link>

          <div className="showcase-content">

            <div className="showcase-badge">
              ✨ AI-Powered Career Tool
            </div>

            <h1>
              Build a resume
              <span> that gets noticed.</span>
            </h1>

            <p>
              Analyze your resume with AI, improve your ATS score,
              discover missing skills and get personalized recommendations.
            </p>

            <div className="showcase-features">

              <div className="showcase-feature">
                <div className="showcase-icon">✓</div>
                <div>
                  <strong>ATS Score Analysis</strong>
                  <span>Understand how your resume performs.</span>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="showcase-icon">✦</div>
                <div>
                  <strong>AI Recommendations</strong>
                  <span>Get practical suggestions to improve.</span>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="showcase-icon">🎯</div>
                <div>
                  <strong>Job Matching</strong>
                  <span>Find important keywords for your target role.</span>
                </div>
              </div>

            </div>
          </div>

          <div className="showcase-footer">
            © 2026 Resume Analyzer
          </div>

        </div>


        {/* Right Side */}
        <div className="auth-panel">

          <div className="auth-card">

            <div className="mobile-brand">
              <div className="auth-brand-icon">
                ✦
              </div>

              <span>Resume Analyzer</span>
            </div>

            <div className="auth-heading">
              <span className="auth-label">
                WELCOME BACK
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Continue your resume improvement journey.
              </p>
            </div>


            {error && (
              <div className="auth-error">
                <span>!</span>
                {error}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              {/* Email */}
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


              {/* Password */}
              <div className="form-group">

                <div className="password-label">

                  <label htmlFor="password">
                    Password
                  </label>

                  <span>
                    Secure login
                  </span>

                </div>

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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                </div>
              </div>


              {/* Remember */}
              <div className="auth-options">

                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <span className="forgot-password">
                  Forgot password?
                </span>

              </div>


              {/* Submit */}
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span>→</span>
                  </>
                )}

              </button>

            </form>


            <div className="auth-divider">
              <span>New to Resume Analyzer?</span>
            </div>


            <Link
              to="/signup"
              className="auth-secondary-button"
            >
              Create an account
            </Link>


            <p className="auth-security">
              🔐 Your account information is securely protected.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;

