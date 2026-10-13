import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Server not reachable");
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h1>RideUp</h1>
      <p className="sub">Rider login</p>
      {error && <div className="error">{error}</div>}
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Password</label>
      <input type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      <p className="sub">New to RideUp? <Link to="/signup">Create an account</Link></p>
    </form>
  );
}
