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
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
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
          data.message || "Account creation failed."
        );
      }

      // Automatically login after signup if token exists
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        navigate("/");
        return;
      }

      // Otherwise go to login
      navigate("/login");

    } catch (err) {
      setError(
        err.message || "Something went wrong."
      );
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

            <span>
              Resume Analyzer
            </span>

          </Link>


          <div className="showcase-content">

            <div className="showcase-badge">
              🚀 Start Your Career Journey
            </div>

            <h1>
              Make your resume
              <span> job-ready.</span>
            </h1>

            <p>
              Create your account and use AI-powered
              resume analysis to make your next job
              application stronger.
            </p>


            <div className="showcase-features">

              <div className="showcase-feature">

                <div className="showcase-icon">
                  📊
                </div>

                <div>
                  <strong>Smart ATS Analysis</strong>
                  <span>
                    Get an easy-to-understand resume score.
                  </span>
                </div>

              </div>


              <div className="showcase-feature">

                <div className="showcase-icon">
                  🤖
                </div>

                <div>
                  <strong>AI-Powered Insights</strong>
                  <span>
                    Discover strengths and improvement areas.
                  </span>
                </div>

              </div>


              <div className="showcase-feature">

                <div className="showcase-icon">
                  🎯
                </div>

                <div>
                  <strong>Better Job Matching</strong>
                  <span>
                    Improve keyword and skill compatibility.
                  </span>
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

              <span>
                Resume Analyzer
              </span>

            </div>


            <div className="auth-heading">

              <span className="auth-label">
                GET STARTED
              </span>

              <h2>
                Create your account
              </h2>

              <p>
                Join Resume Analyzer and improve your resume with AI.
              </p>

            </div>


            {error && (
              <div className="auth-error">

                <span>!</span>

                {error}

              </div>
            )}


            <form onSubmit={handleSubmit}>

              {/* Name */}
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


              {/* Email */}
              <div className="form-group">

                <label htmlFor="signup-email">
                  Email Address
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    id="signup-email"
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

                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    id="signup-password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                  />

                </div>

              </div>


              {/* Confirm Password */}
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


              {/* Submit */}
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
              <span>Already have an account?</span>
            </div>


            <Link
              to="/login"
              className="auth-secondary-button"
            >
              Sign in instead
            </Link>


            <p className="auth-security">
              🔐 Your information is securely protected.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Signup;
