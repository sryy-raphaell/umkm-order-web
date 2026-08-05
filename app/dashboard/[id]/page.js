"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  WIDGET_ICONS,
  LuCheck,
  LuPencil,
  LuPuzzle,
  IconLabel,
} from "../../components/icons";

// ─── Widget type definitions ──────────────────────────────────────────────────
const WIDGET_TYPES = [
  { type: "value",   label: "Value Display", defaultW: 2, defaultH: 2 },
  { type: "gauge",   label: "Gauge",         defaultW: 2, defaultH: 2 },
  { type: "chart",   label: "Line Chart",    defaultW: 4, defaultH: 3 },
  { type: "button",  label: "Button",        defaultW: 2, defaultH: 1 },
  { type: "label",   label: "Label",         defaultW: 2, defaultH: 1 },
];

const PIN_OPTIONS = [
  { value: "temperature", label: "Temperature" },
  { value: "humidity",    label: "Humidity" },
  { value: "V0", label: "Virtual Pin V0" },
  { value: "V1", label: "Virtual Pin V1" },
  { value: "V2", label: "Virtual Pin V2" },
  { value: "V3", label: "Virtual Pin V3" },
  { value: "V4", label: "Virtual Pin V4" },
  { value: "relay0", label: "Relay Ch.0" },
  { value: "relay1", label: "Relay Ch.1" },
  { value: "relay2", label: "Relay Ch.2" },
  { value: "relay3", label: "Relay Ch.3" },
];

const GRID_COLS = 12;
const CELL = 72; // px per grid cell
const GAP  = 8;

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDeviceValue(device, pin) {
  if (!device) return null;
  if (pin === "temperature") return device.temperature;
  if (pin === "humidity")    return device.humidity;
  if (pin?.startsWith("V"))  return device.pins?.[pin] ?? null;
  if (pin?.startsWith("relay")) {
    const ch = pin.replace("relay", "");
    return device.relays?.[ch] ?? device.relay ?? false;
  }
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Individual widgets ───────────────────────────────────────────────────────

function ValueWidget({ widget, device, history }) {
  const val = getDeviceValue(device, widget.config?.pin);
  const unit = widget.config?.unit ?? "";
  const color = widget.config?.color ?? "var(--accent)";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "4px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{widget.title}</p>
      <p style={{ fontSize: "32px", fontWeight: 700, color, letterSpacing: "-1px", lineHeight: 1 }}>
        {val !== null ? (typeof val === "number" ? val.toFixed(1) : val) : "—"}
      </p>
      {unit && <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{unit}</p>}
    </div>
  );
}

function GaugeWidget({ widget, device }) {
  const val  = getDeviceValue(device, widget.config?.pin) ?? 0;
  const min  = widget.config?.min ?? 0;
  const max  = widget.config?.max ?? 100;
  const unit = widget.config?.unit ?? "";
  const color = widget.config?.color ?? "var(--accent)";
  const pct  = Math.min(1, Math.max(0, (val - min) / (max - min)));
  const angle = -140 + pct * 280;
  const r = 38;
  const cx = 60, cy = 60;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = cx + r * Math.cos(toRad(angle - 90));
  const arcY = cy + r * Math.sin(toRad(angle - 90));
  const startX = cx + r * Math.cos(toRad(-140 - 90));
  const startY = cy + r * Math.sin(toRad(-140 - 90));
  const largeArc = pct > 0.5 ? 1 : 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{widget.title}</p>
      <svg width="120" height="80" viewBox="0 0 120 80">
        {/* Background arc */}
        <path d={`M ${cx + r * Math.cos(toRad(-140-90))} ${cy + r * Math.sin(toRad(-140-90))} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(toRad(140-90))} ${cy + r * Math.sin(toRad(140-90))}`}
          fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        {/* Value arc */}
        {pct > 0 && (
          <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${arcX} ${arcY}`}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        )}
        <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700">
          {typeof val === "number" ? val.toFixed(1) : val}
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="var(--text-muted)" fontSize="9">{unit}</text>
        <text x={cx - r + 4} y={cy + 16} fill="var(--text-muted)" fontSize="8">{min}</text>
        <text x={cx + r - 4} y={cy + 16} textAnchor="end" fill="var(--text-muted)" fontSize="8">{max}</text>
      </svg>
    </div>
  );
}

function ChartWidget({ widget, history, device }) {
  const pin   = widget.config?.pin ?? "temperature";
  const color = widget.config?.color ?? "var(--accent)";
  const data  = (history ?? []).slice(-20).map((h) => ({
    t: h.time,
    v: pin === "temperature" ? h.temperature : pin === "humidity" ? h.humidity : (h.pins?.[pin] ?? 0),
  }));
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, padding: "2px 4px" }}>{widget.title}</p>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }} />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g-${widget.id})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ButtonWidget({ widget, device, onRelay }) {
  const pin = widget.config?.pin ?? "relay0";
  const isRelay = pin.startsWith("relay");
  const val = getDeviceValue(device, pin);
  const isOn = Boolean(val);
  const onLabel  = widget.config?.onLabel  ?? "ON";
  const offLabel = widget.config?.offLabel ?? "OFF";
  const color    = widget.config?.color ?? "var(--accent)";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{widget.title}</p>
      <button
        onClick={() => isRelay && device && onRelay(device.deviceName, pin, !isOn)}
        style={{
          padding: "8px 20px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
          cursor: isRelay ? "pointer" : "default",
          background: isOn ? `${color}18` : "var(--bg-tertiary)",
          color: isOn ? color : "var(--text-muted)",
          border: `1px solid ${isOn ? color + "44" : "var(--border)"}`,
          transition: "all 0.2s",
          minWidth: "80px",
        }}
      >
        {isOn ? onLabel : offLabel}
      </button>
    </div>
  );
}

function LabelWidget({ widget }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "13px", fontWeight: 500, color: widget.config?.color ?? "var(--text-secondary)", textAlign: "center" }}>
        {widget.title}
      </p>
    </div>
  );
}

// ─── Widget wrapper (drag + resize) ──────────────────────────────────────────

function WidgetBox({ widget, devices, histories, editMode, onUpdate, onDelete, onRelay }) {
  const device  = devices.find((d) => d.deviceName === widget.config?.deviceName);
  const history = histories[widget.config?.deviceName];
  const dragRef = useRef(null);

  const style = {
    position: "absolute",
    left:   widget.x * (CELL + GAP),
    top:    widget.y * (CELL + GAP),
    width:  widget.w * (CELL + GAP) - GAP,
    height: widget.h * (CELL + GAP) - GAP,
    background: "var(--bg-secondary)",
    border: editMode ? "1px dashed var(--border-light)" : "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    transition: editMode ? "none" : "border-color 0.15s",
    boxSizing: "border-box",
    userSelect: "none",
  };

  function startDrag(e) {
    if (!editMode || e.target.dataset.resize) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX  = widget.x;
    const origY  = widget.y;

    function onMove(ev) {
      const dx = Math.round((ev.clientX - startX) / (CELL + GAP));
      const dy = Math.round((ev.clientY - startY) / (CELL + GAP));
      const nx = Math.max(0, Math.min(GRID_COLS - widget.w, origX + dx));
      const ny = Math.max(0, origY + dy);
      if (nx !== widget.x || ny !== widget.y) onUpdate({ ...widget, x: nx, y: ny });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startResize(e) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW  = widget.w;
    const origH  = widget.h;

    function onMove(ev) {
      const dw = Math.round((ev.clientX - startX) / (CELL + GAP));
      const dh = Math.round((ev.clientY - startY) / (CELL + GAP));
      const nw = Math.max(1, Math.min(GRID_COLS - widget.x, origW + dw));
      const nh = Math.max(1, origH + dh);
      if (nw !== widget.w || nh !== widget.h) onUpdate({ ...widget, w: nw, h: nh });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div ref={dragRef} style={style} onMouseDown={startDrag}>
      {/* Edit mode overlay */}
      {editMode && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "22px", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px", zIndex: 2 }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", cursor: "move" }}>⠿ {widget.title}</span>
            <button onClick={() => onDelete(widget.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "12px", padding: "0 2px" }}>×</button>
          </div>
          {/* Resize handle */}
          <div
            data-resize="1"
            onMouseDown={startResize}
            style={{ position: "absolute", bottom: 0, right: 0, width: "16px", height: "16px", cursor: "se-resize", zIndex: 3, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "2px" }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M8 0L8 8L0 8" fill="none" stroke="var(--border-light)" strokeWidth="1.5" /></svg>
          </div>
        </>
      )}

      {/* Widget content */}
      <div style={{ padding: editMode ? "22px 8px 8px 8px" : "8px", height: "100%", boxSizing: "border-box" }}>
        {widget.type === "value"  && <ValueWidget  widget={widget} device={device} history={history} />}
        {widget.type === "gauge"  && <GaugeWidget  widget={widget} device={device} />}
        {widget.type === "chart"  && <ChartWidget  widget={widget} device={device} history={history} />}
        {widget.type === "button" && <ButtonWidget widget={widget} device={device} onRelay={onRelay} />}
        {widget.type === "label"  && <LabelWidget  widget={widget} />}
      </div>
    </div>
  );
}

// ─── Widget config modal ──────────────────────────────────────────────────────

function WidgetConfigModal({ widget, devices, onSave, onClose }) {
  const [cfg, setCfg] = useState({
    title:      widget.title  ?? "Widget",
    pin:        widget.config?.pin        ?? "temperature",
    deviceName: widget.config?.deviceName ?? "",
    unit:       widget.config?.unit       ?? "",
    min:        widget.config?.min        ?? 0,
    max:        widget.config?.max        ?? 100,
    color:      widget.config?.color      ?? "var(--accent)",
    onLabel:    widget.config?.onLabel    ?? "ON",
    offLabel:   widget.config?.offLabel   ?? "OFF",
  });

  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", fontSize: "12px", color: "var(--text-primary)", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", display: "block" };

  function save() {
    onSave({
      ...widget,
      title: cfg.title,
      config: {
        pin:        cfg.pin,
        deviceName: cfg.deviceName,
        unit:       cfg.unit,
        min:        Number(cfg.min),
        max:        Number(cfg.max),
        color:      cfg.color,
        onLabel:    cfg.onLabel,
        offLabel:   cfg.offLabel,
      },
    });
  }

  const showMinMax   = widget.type === "gauge";
  const showUnit     = ["value", "gauge"].includes(widget.type);
  const showRelayCfg = widget.type === "button";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "24px" }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", width: "100%", maxWidth: "360px", maxHeight: "90vh", overflowY: "auto" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
          Konfigurasi Widget
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={labelStyle}>Judul</label>
            <input style={inputStyle} value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
          </div>

          <div>
            <label style={labelStyle}>Device</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={cfg.deviceName} onChange={(e) => setCfg({ ...cfg, deviceName: e.target.value })}>
              <option value="">— Pilih Device —</option>
              {devices.map((d) => <option key={d.id} value={d.deviceName}>{d.deviceName}</option>)}
            </select>
          </div>

          {widget.type !== "label" && (
            <div>
              <label style={labelStyle}>Pin / Data Source</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={cfg.pin} onChange={(e) => setCfg({ ...cfg, pin: e.target.value })}>
                {PIN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}

          {showUnit && (
            <div>
              <label style={labelStyle}>Satuan (contoh: °C, %, rpm)</label>
              <input style={inputStyle} value={cfg.unit} onChange={(e) => setCfg({ ...cfg, unit: e.target.value })} placeholder="°C" />
            </div>
          )}

          {showMinMax && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={labelStyle}>Min</label>
                <input style={inputStyle} type="number" value={cfg.min} onChange={(e) => setCfg({ ...cfg, min: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Max</label>
                <input style={inputStyle} type="number" value={cfg.max} onChange={(e) => setCfg({ ...cfg, max: e.target.value })} />
              </div>
            </div>
          )}

          {showRelayCfg && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={labelStyle}>Label ON</label>
                <input style={inputStyle} value={cfg.onLabel} onChange={(e) => setCfg({ ...cfg, onLabel: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Label OFF</label>
                <input style={inputStyle} value={cfg.offLabel} onChange={(e) => setCfg({ ...cfg, offLabel: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Warna</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={cfg.color} onChange={(e) => setCfg({ ...cfg, color: e.target.value })}
                style={{ width: "36px", height: "32px", padding: "2px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
              />
              {["var(--accent)","#60a5fa","#f87171","#fb923c","#a78bfa","#facc15"].map((c) => (
                <button key={c} onClick={() => setCfg({ ...cfg, color: c })}
                  style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, border: cfg.color === c ? "2px solid white" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={save} style={{ flex: 1, padding: "9px 0", fontSize: "13px", fontWeight: 600, background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Simpan
          </button>
          <button onClick={onClose} style={{ padding: "9px 16px", fontSize: "13px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Project Page ────────────────────────────────────────────────────────

export default function ProjectDashboardPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject]     = useState(null);
  const [devices, setDevices]     = useState([]);
  const [histories, setHistories] = useState({});
  const [editMode, setEditMode]   = useState(false);
  const [widgets, setWidgets]     = useState([]);
  const [dirty, setDirty]         = useState(false);
  const [addMenu, setAddMenu]     = useState(false);
  const [configWidget, setConfigWidget] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const saveTimer = useRef(null);

  // Load project
  useEffect(() => {
    fetch(`/api/iot/projects/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => {
        setProject(p);
        setDevices(p.devices ?? []);
        setWidgets(Array.isArray(p.widgets) ? p.widgets : []);
      })
      .catch(() => {});
  }, [id]);

  // Poll devices setiap 3 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/iot/projects/${id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((p) => {
          const devs = p.devices ?? [];
          setDevices(devs);

          const now = new Date();
          const timeLabel = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;

          setHistories((prev) => {
            const next = { ...prev };
            devs.forEach((d) => {
              const prevArr = next[d.deviceName] ?? [];
              next[d.deviceName] = [
                ...prevArr.slice(-29),
                { time: timeLabel, temperature: d.temperature, humidity: d.humidity, pins: d.pins },
              ];
            });
            return next;
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // Auto-save widgets setelah idle 1.5s
  useEffect(() => {
    if (!dirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/iot/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      }).then(() => setDirty(false)).catch(() => {});
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [widgets, dirty, id]);

  function updateWidget(updated) {
    setWidgets((prev) => prev.map((w) => w.id === updated.id ? updated : w));
    setDirty(true);
  }

  function deleteWidget(wid) {
    setWidgets((prev) => prev.filter((w) => w.id !== wid));
    setDirty(true);
  }

  function addWidget(type) {
    const def = WIDGET_TYPES.find((t) => t.type === type);
    const newW = {
      id:     uid(),
      type,
      title:  def.label,
      x: 0, y: 0,
      w: def.defaultW,
      h: def.defaultH,
      config: { pin: "temperature", deviceName: devices[0]?.deviceName ?? "", color: "var(--accent)" },
    };
    setWidgets((prev) => [...prev, newW]);
    setDirty(true);
    setAddMenu(false);
    setConfigWidget(newW);
  }

  function saveConfig(updated) {
    updateWidget(updated);
    setConfigWidget(null);
  }

  async function toggleRelay(deviceName, pin, val) {
    const ch = pin.replace("relay", "");
    await fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName, channel: parseInt(ch), relay: val }),
    });
    // Optimistic update
    setDevices((prev) => prev.map((d) => {
      if (d.deviceName !== deviceName) return d;
      const relays = { ...(d.relays ?? {}), [ch]: val };
      return { ...d, relays, relay: ch === "0" ? val : d.relay };
    }));
  }

  const canvasH = Math.max(6, ...widgets.map((w) => w.y + w.h)) * (CELL + GAP) + GAP * 2;

  if (!project) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Memuat project...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <style>{`
        .canvas-grid { background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: ${CELL + GAP}px ${CELL + GAP}px; }
      `}</style>

      {/* Top bar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}
        >← Back</button>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{project.name}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {devices.length} device · {widgets.length} widget
            {dirty && <span style={{ color: "#f59e0b", marginLeft: "8px" }}>● Menyimpan...</span>}
          </p>
        </div>

        {/* Auth Token */}
        <button onClick={() => setShowToken((v) => !v)}
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "11px", cursor: "pointer" }}
        >
          {showToken ? "Sembunyikan Token" : "Lihat Auth Token"}
        </button>

        {/* Device status pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {devices.map((d) => (
            <span key={d.id} style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "20px", background: d.status === "online" ? "var(--accent-subtle)" : "var(--bg-tertiary)", color: d.status === "online" ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${d.status === "online" ? "rgba(244,121,32,0.2)" : "var(--border)"}` }}>
              {d.deviceName}
            </span>
          ))}
        </div>

        {/* Edit mode toggle */}
        <button
          onClick={() => setEditMode((v) => !v)}
          style={{ background: editMode ? "var(--accent)" : "var(--bg-tertiary)", color: editMode ? "#000" : "var(--text-secondary)", border: "1px solid", borderColor: editMode ? "var(--accent)" : "var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
        >
          {editMode ? (
            <IconLabel icon={LuCheck} size={13}>Done</IconLabel>
          ) : (
            <IconLabel icon={LuPencil} size={13}>Edit</IconLabel>
          )}
        </button>

        {editMode && (
          <button onClick={() => setAddMenu((v) => !v)}
            style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            + Widget
          </button>
        )}
      </div>

      {/* Auth token display */}
      {showToken && (
        <div style={{ padding: "12px 24px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
            Gunakan auth token ini di kode ESP32 kamu:
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ fontSize: "13px", color: "var(--accent)", background: "var(--bg-primary)", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", letterSpacing: "0.5px" }}>
              {project.authToken}
            </code>
            <button onClick={() => navigator.clipboard.writeText(project.authToken)}
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "11px", cursor: "pointer" }}
            >
              Copy
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
            Di ESP32: <code style={{ color: "var(--text-secondary)" }}>POST /api/iot/update</code> dengan header <code style={{ color: "var(--text-secondary)" }}>authToken: &quot;{project.authToken?.slice(0, 8)}...&quot;</code>
          </p>
        </div>
      )}

      {/* Add widget menu */}
      {addMenu && (
        <div style={{ padding: "12px 24px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
{WIDGET_TYPES.map((t) => {
  const Icon = WIDGET_ICONS[t.type];

  return (
    <button
      key={t.type}
      onClick={() => addWidget(t.type)}
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        borderRadius: "var(--radius-md)",
        padding: "10px 16px",
        fontSize: "12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        minWidth: "80px",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--accent)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {Icon && <Icon size={22} color="var(--accent)" aria-hidden />}
      <span>{t.label}</span>
    </button>
  );
})}
        </div>
      )};

      {/* Canvas */}
      <div style={{ padding: "16px 24px", overflowX: "auto" }}>
        <div
          className={editMode ? "canvas-grid" : ""}
          style={{ position: "relative", width: GRID_COLS * (CELL + GAP), minHeight: canvasH, margin: "0 auto" }}
          onClick={() => { if (editMode) setConfigWidget(null); }}
        >
          {widgets.length === 0 && !editMode && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <LuPuzzle size={36} color="var(--text-muted)" aria-hidden />
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Klik <strong style={{ color: "var(--text-secondary)" }}>Edit</strong> lalu <strong style={{ color: "var(--text-secondary)" }}>+ Widget</strong> untuk menambah widget</p>
            </div>
          )}

          {widgets.map((w) => (
            <div key={w.id} onDoubleClick={(e) => { if (editMode) { e.stopPropagation(); setConfigWidget(w); } }}>
              <WidgetBox
                widget={w}
                devices={devices}
                histories={histories}
                editMode={editMode}
                onUpdate={updateWidget}
                onDelete={deleteWidget}
                onRelay={toggleRelay}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Config modal */}
      {configWidget && (
        <WidgetConfigModal
          widget={configWidget}
          devices={devices}
          onSave={saveConfig}
          onClose={() => setConfigWidget(null)}
        />
      )}
    </div>
  );
}
