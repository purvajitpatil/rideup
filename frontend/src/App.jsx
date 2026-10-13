import { Routes, Route, Navigate } from "react-router-dom";
import { hasSession, getRole } from "./session.js";
import Start from "./pages/Start.jsx";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/Home.jsx";
import CaptainHome from "./pages/CaptainHome.jsx";

function Protected({ role, children }) {
  if (hasSession(role)) return children;
  return <Navigate to={role === "captain" ? "/captain/login" : "/login"} replace />;
}

// Signed-in people skip the landing page
function Landing() {
  const role = getRole();
  if (hasSession("user")) return <Navigate to="/home" replace />;
  if (hasSession("captain")) return <Navigate to="/captain/home" replace />;
  return <Start />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth role="user" mode="login" />} />
      <Route path="/signup" element={<Auth role="user" mode="signup" />} />
      <Route path="/captain/login" element={<Auth role="captain" mode="login" />} />
      <Route path="/captain/signup" element={<Auth role="captain" mode="signup" />} />
      <Route path="/home" element={<Protected role="user"><Home /></Protected>} />
      <Route path="/captain/home" element={<Protected role="captain"><CaptainHome /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
