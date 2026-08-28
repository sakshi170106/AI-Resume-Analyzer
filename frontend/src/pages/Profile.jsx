import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }

  const initial = user.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="profile-page">

      <div className="profile-background"></div>

      <div className="profile-wrapper">

        {/* Header */}
        <div className="profile-topbar">
          <Link to="/" className="profile-logo">
            <span>✦</span>
            ResumeAI
          </Link>

          <Link to="/" className="back-home">
            ← Back to Home
          </Link>
        </div>

        {/* Profile Card */}
        <div className="profile-card">

          <div className="profile-card-header">
            <span>MY PROFILE</span>
          </div>

          <div className="profile-main">

            <div className="profile-avatar">
              {initial}
            </div>

            <h1>{user.name}</h1>

            <p className="profile-email">
              {user.email}
            </p>

            <div className="profile-status">
              <span className="status-dot"></span>
              Account Active
            </div>

          </div>

          <div className="profile-details">

            <div className="detail-item">
              <span className="detail-icon">👤</span>

              <div>
                <small>FULL NAME</small>
                <strong>{user.name}</strong>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon">✉</span>

              <div>
                <small>EMAIL ADDRESS</small>
                <strong>{user.email}</strong>
              </div>
            </div>

          </div>

          <div className="profile-actions">

            <Link to="/analyzer" className="analyze-button">
              Analyze My Resume
              <span>→</span>
            </Link>

            <button
              onClick={handleLogout}
              className="logout-button"
            >
              <span>↪</span>
              Logout
            </button>

          </div>

          <p className="profile-security">
            🔐 Your account information is securely stored.
          </p>

        </div>

      </div>
    </div>
  );
}

export default Profile;