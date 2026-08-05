"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LuRadio } from "../components/icons";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/iot/projects")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, []);

  async function createProject() {
    if (!form.name.trim()) return;
    const res = await fetch("/api/iot/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const p = await res.json();
    setProjects((prev) => [p, ...prev]);
    setShowCreate(false);
    setForm({ name: "", description: "" });
    router.push(`/dashboard/${p.id}`);
  }

  async function deleteProject(id, e) {
    e.stopPropagation();
    if (!confirm("Hapus project ini?")) return;
    await fetch(`/api/iot/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "28px 40px" }}>
      <style>{`
        .proj-card { transition: border-color 0.15s, background 0.15s; cursor: pointer; }
        .proj-card:hover { border-color: var(--border-light) !important; background: var(--bg-hover) !important; }
        .input-base { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 13px; color: var(--text-primary); width: 100%; outline: none; font-family: inherit; box-sizing: border-box; }
        .input-base:focus { border-color: var(--accent); }
        .input-base::placeholder { color: var(--text-muted); }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Dashboard IoT</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Kelola project dan widget perangkat IoT</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
            <LuRadio size={40} color="var(--text-muted)" aria-hidden />
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>Belum ada project</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Buat project baru untuk mulai monitoring perangkat IoT</p>
          <button onClick={() => setShowCreate(true)} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", padding: "9px 22px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Buat Project Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {projects.map((p) => (
            <div key={p.id} className="proj-card" onClick={() => router.push(`/dashboard/${p.id}`)}
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{p.name}</p>
                  {p.description && <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.description}</p>}
                </div>
                <button onClick={(e) => deleteProject(p.id, e)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", padding: "0 4px", flexShrink: 0, lineHeight: 1 }}
                >×</button>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {p.devices?.length > 0 ? p.devices.map((d) => (
                  <span key={d.id} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: d.status === "online" ? "var(--accent-subtle)" : "var(--bg-tertiary)", color: d.status === "online" ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${d.status === "online" ? "rgba(244,121,32,0.2)" : "var(--border)"}` }}>
                    {d.deviceName}
                  </span>
                )) : (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Belum ada device</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {Array.isArray(p.widgets) ? p.widgets.length : 0} widget
                </span>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "2px 8px", borderRadius: "4px" }}>
                  {p.authToken?.slice(0, 14)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", width: "100%", maxWidth: "380px" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Buat Project Baru</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <input className="input-base" placeholder="Nama project" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && createProject()}
              />
              <input className="input-base" placeholder="Deskripsi (opsional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={createProject} style={{ flex: 1, padding: "9px 0", fontSize: "13px", fontWeight: 600, background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                Buat Project
              </button>
              <button onClick={() => { setShowCreate(false); setForm({ name: "", description: "" }); }}
                style={{ padding: "9px 16px", fontSize: "13px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}