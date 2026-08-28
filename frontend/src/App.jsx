import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Analyzer from "./pages/Analyzer";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <div className="app">

        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/analyzer" element={<Analyzer />} />

          <Route path="/results" element={<Results />} />

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/profile" element={<Profile />} />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;