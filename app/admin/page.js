"use client";
import { useState, useEffect } from "react";
import ProductImage from "../components/ProductImage";
import {
  LuPackage,
  LuShoppingBag,
  LuCheck,
  LuX,
  LuTrash2,
  LuFolderOpen,
  LuSearch,
  IconLabel,
} from "../components/icons";

// ─── helpers ────────────────────────────────────────────────────────────────

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

const STATUS_FLOW_SERVICE = [
  "pending",
  "negosiasi",
  "pembayaran",
  "pembuatan",
  "pengiriman",
  "selesai",
];
const STATUS_FLOW_PRODUCT = [
  "pending",
  "negosiasi",
  "pembayaran",
  "pengiriman",
  "selesai",
];

const STATUS_LABEL = {
  pending:    { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.2)" },
  negosiasi:  { label: "Negosiasi", color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.2)" },
  pembayaran: { label: "Pembayaran", color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)" },
  pembuatan:  { label: "Pembuatan", color: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.2)" },
  pengiriman: { label: "Pengiriman", color: "#38bdf8", bg: "rgba(56,189,248,0.08)",   border: "rgba(56,189,248,0.2)" },
  selesai:    { label: "Selesai",   color: "var(--accent)", bg: "rgba(244,121,32,0.08)",   border: "rgba(244,121,32,0.2)" },
  dibatalkan: { label: "Dibatalkan",color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: "var(--text-muted)", bg: "var(--bg-tertiary)", border: "var(--border)" };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      padding: "3px 9px", borderRadius: "20px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function getNextStatuses(items, currentStatus) {
  const hasService = Array.isArray(items) && items.some((i) => i.type === "service");
  const flow = hasService ? STATUS_FLOW_SERVICE : STATUS_FLOW_PRODUCT;
  const result = [];
  
  // Kalau negosiasi (bisa terjadi di order product juga), next adalah pembayaran
  if (currentStatus === "negosiasi") {
    result.push("pembayaran");
    result.push("dibatalkan");
    return result;
  }
  
  const idx = flow.indexOf(currentStatus);
  if (idx !== -1 && idx < flow.length - 1) result.push(flow[idx + 1]);
  if (currentStatus !== "selesai" && currentStatus !== "dibatalkan") result.push("dibatalkan");
  return result;
}

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function matchesQuery(query, ...fields) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: "16px", maxWidth: "400px" }}>
      <LuSearch
        size={14}
        aria-hidden
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        style={{ ...inputStyle, paddingLeft: "34px", paddingRight: value ? "34px" : "12px" }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LuX size={14} />
        </button>
      )}
    </div>
  );
}

function orderMatchesSearch(order, query) {
  const statusLabel = STATUS_LABEL[order.status]?.label ?? order.status;
  const itemNames = Array.isArray(order.items)
    ? order.items.map((i) => i.name).join(" ")
    : "";
  return matchesQuery(
    query,
    order.id,
    order.user?.name,
    order.user?.phone,
    itemNames,
    statusLabel,
    order.status,
    order.note,
  );
}

function productMatchesSearch(item, query) {
  return matchesQuery(
    query,
    item.id,
    item.name,
    item.description,
    item.longDescription,
    item.type === "product" ? "produk" : "layanan",
    item.price,
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [authenticated, setAuthenticated] = useState(null); // null = checking, false = locked, true = unlocked
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setAuthenticated(!!data.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }

  async function handleLogin(e) {
    e?.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        setPassword("");
      } else {
        setLoginError(data.error || "Password admin tidak sesuai");
      }
    } catch {
      setLoginError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    if (!confirm("Keluar dari Admin?")) return;
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
  }

  if (authenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px" }}>
        Memeriksa hak akses admin...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{
          width: "100%", maxWidth: "380px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px 28px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%", background: "var(--accent-subtle)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", border: "1px solid rgba(244,121,32,0.3)", fontSize: "20px"
            }}>
              🔒
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
              Admin Portal
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Masukkan password untuk mengelola sistem
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin..."
                style={inputStyle}
                autoFocus
              />
            </div>

            {loginError && (
              <p style={{ fontSize: "12px", color: "var(--red)", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", padding: "8px 12px", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              style={{
                background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px", fontSize: "14px", fontWeight: 600, cursor: submitting || !password ? "default" : "pointer", opacity: submitting || !password ? 0.7 : 1, transition: "all 0.2s"
              }}
            >
              {submitting ? "Memverifikasi..." : "Masuk Admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "28px 40px" }}>
      <style>{`
        .admin-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .admin-grid { grid-template-columns: 1fr 1fr; } }
        input:focus, select:focus, textarea:focus { border-color: var(--accent) !important; }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        .order-row:hover { background: var(--bg-hover) !important; }
        .tab-btn { transition: all 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
            Admin
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Kelola produk, layanan, dan pesanan
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          Keluar (Logout) 🚪
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {[
          { key: "orders", label: "Orders", Icon: LuPackage },
          { key: "products", label: "Produk & Layanan", Icon: LuShoppingBag },
          { key: "umkm", label: "UMKM", Icon: LuFolderOpen },
        ].map((t) => (
          <button
            key={t.key}
            className="tab-btn"
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: activeTab === t.key ? 600 : 400,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              marginBottom: "-1px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <t.Icon size={14} aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "orders" ? <OrdersTab /> : activeTab === "products" ? <ProductsTab /> : activeTab === "umkm" ? <UmkmManager /> : null}
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [offerModal, setOfferModal] = useState(null); // { orderId, orderName, currentTotal }
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // { orderId, note }

  const [refresh, setRefresh] = useState(0);
  const reloadOrders = () => setRefresh((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refresh]);

  const statusFiltered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const filtered = debouncedSearch.trim()
    ? statusFiltered.filter((o) => orderMatchesSearch(o, debouncedSearch))
    : statusFiltered;

  async function updateStatus(orderId, newStatus) {
    if (!confirm(`Update status ke "${newStatus}"?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      reloadOrders();
    } finally { setLoading(false); }
  }

  async function deleteOrder(orderId) {
    if (!confirm(`Hapus order #${orderId} permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      reloadOrders();
    } finally { setLoading(false); }
  }

  async function submitOffer() {
    if (!offerAmount || isNaN(parseInt(offerAmount))) {
      alert("Masukkan nominal harga yang valid");
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/orders/${offerModal.orderId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "admin",
          amount: parseInt(offerAmount),
          message: offerMsg,
        }),
      });
      setOfferModal(null);
      setOfferAmount("");
      setOfferMsg("");
      reloadOrders();
    } finally { setLoading(false); }
  }

  async function respondOffer(orderId, offerId, action) {
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/offer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, action }),
      });
      reloadOrders();
    } finally { setLoading(false); }
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cari order (ID, nama, HP, item, status)..."
      />

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {[["all", "Semua", orders.length], ...Object.entries(STATUS_LABEL).map(([k, v]) => [k, v.label, statusCounts[k] || 0])].map(([key, label, count]) => (
          count > 0 || key === "all" ? (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: filterStatus === key ? 600 : 400,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: filterStatus === key ? "var(--accent)" : "var(--border)",
                background: filterStatus === key ? "var(--accent-subtle)" : "transparent",
                color: filterStatus === key ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          ) : null
        ))}
      </div>

      {/* Orders list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
            {orders.length === 0
              ? "Tidak ada order"
              : debouncedSearch.trim()
                ? `Tidak ada order yang cocok dengan "${debouncedSearch.trim()}"`
                : "Tidak ada order dengan status ini"}
          </p>
        )}

        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          const nextStatuses = getNextStatuses(order.items, order.status);
          const hasService = Array.isArray(order.items) && order.items.some((i) => i.type === "service");
          const offers = Array.isArray(order.priceOffers) ? order.priceOffers : [];
          const pendingOffers = offers.filter((o) => o.status === "pending");
          const finalPrice = order.negotiatedPrice ?? order.total;

          return (
            <div
              key={order.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              {/* Order header row */}
              <div
                className="order-row"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                {/* ID + nama */}
                <div style={{ minWidth: "60px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{order.id}</p>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {order.user?.name ?? "—"}
                  </p>
                </div>

                {/* Items preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {Array.isArray(order.items) ? order.items.map((i) => `${i.name} x${i.qty}`).join(", ") : "—"}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Harga */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: order.negotiatedPrice ? "var(--accent)" : "var(--text-primary)" }}>
                    Rp {finalPrice.toLocaleString("id-ID")}
                  </p>
                  {order.negotiatedPrice && order.negotiatedPrice !== order.total && (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "line-through" }}>
                      Rp {order.total.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={order.status} />

                {/* Pending offers badge */}
                {pendingOffers.length > 0 && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "20px",
                    background: "rgba(251,146,60,0.15)", color: "#fb923c",
                    border: "1px solid rgba(251,146,60,0.3)",
                  }}>
                    {pendingOffers.length} penawaran
                  </span>
                )}

                {/* Type badge */}
                <span style={{
                  fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                  background: hasService ? "var(--accent-subtle)" : "var(--blue-subtle)",
                  color: hasService ? "var(--accent)" : "var(--blue)",
                  border: `1px solid ${hasService ? "rgba(244,121,32,0.2)" : "rgba(96,165,250,0.2)"}`,
                  flexShrink: 0,
                }}>
                  {hasService ? "Layanan" : "Produk"}
                </span>

                <span style={{ color: "var(--text-muted)", fontSize: "12px", flexShrink: 0 }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "16px" }}>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>

                    {/* Kiri: detail items + info */}
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
                        DETAIL ORDER
                      </p>
                      {Array.isArray(order.items) && order.items.map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "7px 0",
                          borderBottom: i < order.items.length - 1 ? "1px solid var(--border)" : "none",
                          gap: "8px",
                        }}>
                          <div>
                            <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{item.name}</p>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              x{item.qty} · {item.type === "service" ? "Layanan" : "Produk"}
                            </p>
                          </div>
                          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0 }}>
                            Rp {(item.price * item.qty).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ))}

                      {/* Harga summary */}
                      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total awal</span>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Rp {order.total.toLocaleString("id-ID")}</span>
                        </div>
                        {order.negotiatedPrice && (
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Harga negosiasi</span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>Rp {order.negotiatedPrice.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        {hasService && order.status === "pembayaran" && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "12px", color: "#60a5fa" }}>DP 50%</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa" }}>
                              Rp {Math.ceil(finalPrice / 2).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info user */}
                      <div style={{ marginTop: "10px", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>KONTAK PEMBELI</p>
                        <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{order.user?.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{order.user?.phone}</p>
                      </div>

                      {order.note && (
                        <div style={{ marginTop: "8px", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>CATATAN</p>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{order.note}</p>
                        </div>
                      )}
                    </div>

                    {/* Kanan: actions + negosiasi */}
                    <div style={{ width: "260px", flexShrink: 0 }}>

                      {/* Update Status */}
                      {nextStatuses.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
                            UPDATE STATUS
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {nextStatuses.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(order.id, s)}
                                disabled={loading}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  border: "1px solid",
                                  transition: "all 0.15s",
                                  background: s === "dibatalkan" ? "rgba(248,113,113,0.08)" : "var(--accent-subtle)",
                                  color: s === "dibatalkan" ? "var(--red)" : "var(--accent)",
                                  borderColor: s === "dibatalkan" ? "rgba(248,113,113,0.25)" : "rgba(244,121,32,0.25)",
                                }}
                              >
                                → {STATUS_LABEL[s]?.label ?? s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Penawaran harga */}
                      {["pending", "negosiasi"].includes(order.status) && (
                        <div style={{ marginBottom: "12px" }}>
                          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
                            NEGOSIASI HARGA
                          </p>

                          {/* Daftar offer */}
                          {offers.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                              {offers.map((offer) => (
                                <div key={offer.id} style={{
                                  padding: "8px 10px",
                                  background: "var(--bg-tertiary)",
                                  borderRadius: "var(--radius-sm)",
                                  border: `1px solid ${
                                    offer.status === "accepted" ? "rgba(244,121,32,0.3)" :
                                    offer.status === "rejected" ? "rgba(248,113,113,0.2)" :
                                    "var(--border)"
                                  }`,
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "11px", color: offer.from === "admin" ? "var(--blue)" : "var(--accent)", fontWeight: 600 }}>
                                      {offer.from === "admin" ? "Admin" : "User"}
                                    </span>
                                    <span style={{ fontSize: "11px", color:
                                      offer.status === "accepted" ? "var(--accent)" :
                                      offer.status === "rejected" ? "var(--red)" :
                                      "var(--text-muted)"
                                    }}>
                                      {offer.status === "accepted" ? (
                                        <IconLabel icon={LuCheck} size={11}>Diterima</IconLabel>
                                      ) : offer.status === "rejected" ? (
                                        <IconLabel icon={LuX} size={11}>Ditolak</IconLabel>
                                      ) : (
                                        "Menunggu"
                                      )}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                    Rp {offer.amount.toLocaleString("id-ID")}
                                  </p>
                                  {offer.message && (
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                      &ldquo;{offer.message}&rdquo;
                                    </p>
                                  )}

                                  {/* Accept/Reject untuk offer dari user yang masih pending */}
                                  {offer.status === "pending" && offer.from === "user" && (
                                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                      <button
                                        onClick={() => respondOffer(order.id, offer.id, "accept")}
                                        disabled={loading}
                                        style={{
                                          flex: 1, padding: "5px 0", fontSize: "11px", fontWeight: 600,
                                          background: "var(--accent-subtle)", color: "var(--accent)",
                                          border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <IconLabel icon={LuCheck} size={11} style={{ justifyContent: "center", width: "100%" }}>Terima</IconLabel>
                                      </button>
                                      <button
                                        onClick={() => respondOffer(order.id, offer.id, "reject")}
                                        disabled={loading}
                                        style={{
                                          flex: 1, padding: "5px 0", fontSize: "11px", fontWeight: 600,
                                          background: "rgba(248,113,113,0.08)", color: "var(--red)",
                                          border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <IconLabel icon={LuX} size={11} style={{ justifyContent: "center", width: "100%" }}>Tolak</IconLabel>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tombol counter-offer */}
                          <button
                            onClick={() => setOfferModal({ orderId: order.id, orderName: order.user?.name, currentTotal: finalPrice })}
                            style={{
                              width: "100%", padding: "7px 0", fontSize: "12px", fontWeight: 600,
                              background: "rgba(167,139,250,0.08)", color: "#a78bfa",
                              border: "1px solid rgba(167,139,250,0.25)", borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                          >
                            + Ajukan Harga
                          </button>
                        </div>
                      )}

                      {/* Hapus order */}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        disabled={loading}
                        style={{
                          width: "100%", padding: "7px 0", fontSize: "12px", fontWeight: 500,
                          background: "transparent", color: "var(--red)",
                          border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
                          cursor: "pointer", marginTop: "4px",
                        }}
                      >
                        <IconLabel icon={LuTrash2} size={13} style={{ justifyContent: "center", width: "100%" }}>Hapus Order</IconLabel>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Ajukan Harga */}
      {offerModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px",
        }}>
          <div style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "24px", width: "100%", maxWidth: "360px",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              Ajukan Harga
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Order #{offerModal.orderId} — {offerModal.orderName}
            </p>

            <div style={{ marginBottom: "10px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                Harga saat ini: Rp {offerModal.currentTotal.toLocaleString("id-ID")}
              </p>
              <input
                style={inputStyle}
                type="number"
                placeholder="Harga yang ditawarkan (Rp)"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <textarea
                style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                placeholder="Pesan/alasan (opsional)"
                value={offerMsg}
                onChange={(e) => setOfferMsg(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={submitOffer}
                disabled={loading}
                style={{
                  flex: 1, padding: "9px 0", fontSize: "13px", fontWeight: 600,
                  background: "var(--accent-subtle)", color: "var(--accent)",
                  border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                Kirim Penawaran
              </button>
              <button
                onClick={() => { setOfferModal(null); setOfferAmount(""); setOfferMsg(""); }}
                style={{
                  padding: "9px 16px", fontSize: "13px",
                  background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
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

function UmkmManager() {
  const [umkmList, setUmkmList] = useState([]);
  const [form, setForm] = useState({ namaOwner: "", namaUsaha: "", alamatUsaha: "", noHpWa: "", logoUrl: "", posterUrl: "" });
  const [editId, setEditId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  async function loadUmkm() {
    const res = await fetch("/api/umkm");
    setUmkmList(await res.json());
  }
  useEffect(() => { loadUmkm(); }, []);

  async function uploadFile(file) {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const result = await res.json();
    return result.url || null;
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadFile(file);
    if (url) setForm((f) => ({ ...f, logoUrl: url }));
    setUploadingLogo(false);
  }

  async function handlePosterChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPoster(true);
    const url = await uploadFile(file);
    if (url) setForm((f) => ({ ...f, posterUrl: url }));
    setUploadingPoster(false);
  }

  async function handleSubmit() {
    if (!form.namaOwner || !form.namaUsaha || !form.noHpWa) {
      alert("Nama owner, nama usaha, dan No HP/WA wajib diisi");
      return;
    }
    if (editId) {
      await fetch(`/api/umkm/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/umkm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setForm({ namaOwner: "", namaUsaha: "", alamatUsaha: "", noHpWa: "", logoUrl: "", posterUrl: "" });
    setEditId(null);
    loadUmkm();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus UMKM ini beserta semua produknya?")) return;
    await fetch(`/api/umkm/${id}`, { method: "DELETE" });
    loadUmkm();
  }

  return (
    <div>
      {/* form: reuse inputStyle yang sudah ada di file ini */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "420px" }}>
        <input style={inputStyle} placeholder="Nama owner" value={form.namaOwner} onChange={(e) => setForm({ ...form, namaOwner: e.target.value })} />
        <input style={inputStyle} placeholder="Nama usaha" value={form.namaUsaha} onChange={(e) => setForm({ ...form, namaUsaha: e.target.value })} />
        <input style={inputStyle} placeholder="Alamat usaha (nagari/kecamatan)" value={form.alamatUsaha} onChange={(e) => setForm({ ...form, alamatUsaha: e.target.value })} />
        <input style={inputStyle} placeholder="No HP/WA" value={form.noHpWa} onChange={(e) => setForm({ ...form, noHpWa: e.target.value })} />

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
            Logo UMKM (opsional — kalau kosong, tampil inisial nama usaha)
          </label>
          <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: "12px" }} />
          {uploadingLogo && <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Mengunggah...</p>}
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Preview logo" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "var(--radius-sm)", marginTop: "6px", border: "1px solid var(--border)" }} />
          )}
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
            Poster katalog produk (opsional — desain flyer menu, tampil di halaman toko sebelum daftar produk)
          </label>
          <input type="file" accept="image/*" onChange={handlePosterChange} style={{ fontSize: "12px" }} />
          {uploadingPoster && <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Mengunggah...</p>}
          {form.posterUrl && (
            <img src={form.posterUrl} alt="Preview poster" style={{ width: "100%", maxWidth: "200px", objectFit: "cover", borderRadius: "var(--radius-sm)", marginTop: "6px", border: "1px solid var(--border)" }} />
          )}
        </div>

        <button onClick={handleSubmit} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {editId ? "Update UMKM" : "Tambah UMKM"}
        </button>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {umkmList.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{u.namaUsaha}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.namaOwner} · {u.alamatUsaha} · {u.items?.length || 0} produk{u.posterUrl ? " · ada poster" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => { setEditId(u.id); setForm({ namaOwner: u.namaOwner, namaUsaha: u.namaUsaha, alamatUsaha: u.alamatUsaha, noHpWa: u.noHpWa, logoUrl: u.logoUrl || "", posterUrl: u.posterUrl || "" }); }} style={{ fontSize: "11px", cursor: "pointer" }}>Edit</button>
              <button onClick={() => handleDelete(u.id)} style={{ fontSize: "11px", color: "var(--red)", cursor: "pointer" }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Products Tab (existing admin functionality) ──────────────────────────────

function ProductsTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [form, setForm] = useState({ name: "", type: "produk", price: "", description: "", longDescription: "", images: [], umkmId: "" });
  const [umkmOptions, setUmkmOptions] = useState([]);
  useEffect(() => { fetch("/api/umkm").then((r) => r.json()).then(setUmkmOptions); }, []);
  const [editId, setEditId] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  function addImageUrl() {
    if (!imageUrl.trim()) return;
    setForm({ ...form, images: [...(form.images || []), imageUrl.trim()] });
    setImageUrl("");
  }

  function removeImage(index) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const uploaded = [];
    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.url) uploaded.push(result.url);
    }
    setForm({ ...form, images: [...(form.images || []), ...uploaded] });
  }

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const res = await fetch("/api/products");
    setItems(await res.json());
  }

  async function handleSubmit() {
  if (!form.name || !form.description || !form.umkmId) { alert("Nama, deskripsi, dan UMKM wajib diisi"); return; }
    const payload = { ...form, price: parseInt(form.price) };
    if (editId) {
      await fetch(`/api/products/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setEditId(null);
    } else {
      await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setForm({ name: "", type: "product", price: "", description: "", longDescription: "", images: [] });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus item ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadItems();
  }

  function handleEdit(item) {
    setEditId(item.id);
    setForm({ name: item.name, type: item.type, price: item.price, description: item.description, longDescription: item.longDescription || "", images: item.images || [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredItems = debouncedSearch.trim()
    ? items.filter((item) => productMatchesSearch(item, debouncedSearch))
    : items;

  return (
    <div>
      {/* Form tambah/edit */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "16px" }}>
          {editId ? "Edit Item" : "Tambah Item Baru"}
        </p>
        <div className="admin-grid">
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.umkmId} onChange={(e) => setForm({ ...form, umkmId: e.target.value })}>
  <option value="">Pilih UMKM...</option>
  {umkmOptions.map((u) => (
    <option key={u.id} value={u.id}>{u.namaUsaha}</option>
  ))}
</select>
          <input style={inputStyle} placeholder="Nama produk/layanan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="product">Produk</option>
            <option value="service">Layanan</option>
          </select>
          <input style={inputStyle} placeholder="Harga (angka)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input style={inputStyle} placeholder="Deskripsi singkat" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div style={{ gridColumn: "1 / -1" }}>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Deskripsi lengkap (opsional)" value={form.longDescription || ""} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Gambar produk</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Paste URL gambar" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <button onClick={addImageUrl} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>+ URL</button>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "10px" }}>
              <LuFolderOpen size={14} aria-hidden />
              Upload Gambar
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUpload} />
            </label>
            {(form.images || []).length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {(form.images || []).map((img, i) => (
                  <div key={i} style={{ position: "relative", width: "80px", height: "80px" }}>
                    <ProductImage src={img} alt="" fill style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }} />
                    <button onClick={() => removeImage(i)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button onClick={handleSubmit} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.25)", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            {editId ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ name: "", type: "product", price: "", description: "", longDescription: "", images: [] }); }} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontSize: "13px", cursor: "pointer" }}>
              Batal
            </button>
          )}
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cari produk/layanan (nama, deskripsi, harga)..."
      />

      {/* List produk */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Daftar Item</p>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {debouncedSearch.trim()
              ? `${filteredItems.length} dari ${items.length} item`
              : `${items.length} item`}
          </span>
        </div>
        {items.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>Belum ada data</p>
        )}
        {items.length > 0 && filteredItems.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
            Tidak ada item yang cocok dengan &ldquo;{debouncedSearch.trim()}&rdquo;
          </p>
        )}
        {filteredItems.map((item, index) => (
          <div key={item.id} style={{ padding: "14px 16px", borderTop: index === 0 ? "none" : "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</p>
                <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: item.type === "product" ? "var(--blue-subtle)" : "var(--accent-subtle)", color: item.type === "product" ? "var(--blue)" : "var(--accent)", border: `1px solid ${item.type === "product" ? "rgba(96,165,250,0.2)" : "rgba(244,121,32,0.2)"}`, flexShrink: 0 }}>
                  {item.type === "product" ? "Produk" : "Layanan"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
              <span style={{ fontSize: "12px", fontWeight: 600, color: item.price != null ? "var(--text-primary)" : "var(--text-muted)", flexShrink: 0 }}>
                {item.price != null ? `Rp ${item.price.toLocaleString("id-ID")}` : "Hubungi penjual"}
              </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => handleEdit(item)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>Edit</button>
              <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}