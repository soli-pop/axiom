import { useState } from "react";
import { supabase } from "./supabase";

export default function SupabaseTest() {
  const [log, setLog] = useState([]);

  const push = (msg, ok = true) =>
    setLog(p => [...p, { msg, ok, t: new Date().toLocaleTimeString() }]);

  const testConnection = async () => {
    push("Testing connection...", true);
    try {
      const { data, error } = await supabase.from("profiles").select("count").limit(1);
      if (error) push("❌ profiles table: " + error.message, false);
      else push("✅ Connected! profiles table reachable.", true);
    } catch (e) {
      push("❌ Exception: " + e.message, false);
    }
  };

  const testSignup = async () => {
    const testEmail = `test_${Date.now()}@axiom.test`;
    push(`Signing up ${testEmail}...`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "Test1234!",
        options: { data: { username: "testuser_" + Date.now(), display_name: "Test User" } }
      });
      if (error) push("❌ Signup failed: " + error.message, false);
      else push("✅ Signup OK — user id: " + data.user?.id, true);
    } catch (e) {
      push("❌ Exception: " + e.message, false);
    }
  };

  const testEnvVars = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    push(url ? `✅ VITE_SUPABASE_URL: ${url}` : "❌ VITE_SUPABASE_URL is missing!", !!url);
    push(key ? `✅ VITE_SUPABASE_ANON_KEY: set (${key.slice(0, 20)}...)` : "❌ VITE_SUPABASE_ANON_KEY is missing!", !!key);
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#111", color: "#eee", minHeight: "100vh" }}>
      <h2>🔬 Supabase Connection Test</h2>
      <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
        <button onClick={testEnvVars} style={btn}>Check Env Vars</button>
        <button onClick={testConnection} style={btn}>Test DB Connection</button>
        <button onClick={testSignup} style={btn}>Test Signup Insert</button>
        <button onClick={() => setLog([])} style={{ ...btn, background: "#444" }}>Clear</button>
      </div>
      <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 8, minHeight: 200 }}>
        {log.length === 0 && <span style={{ color: "#555" }}>Click a button to run tests...</span>}
        {log.map((l, i) => (
          <div key={i} style={{ color: l.ok ? "#7dffb3" : "#ff6b6b", marginBottom: 6 }}>
            [{l.t}] {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

const btn = { padding: "8px 16px", background: "#2A5B52", color: "#A3D1C6", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" };
