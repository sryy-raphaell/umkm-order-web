"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "./components/ProductImage";
import {
  LuBot,
  LuShoppingBag,
  LuFlame,
  LuCheck,
  LuPlus,
  LuChevronLeft,
  LuChevronRight,
  IconLabel,
} from "./components/icons";

function ProductThumbnail({ images, size = 72, alt = "" }) {
  const src = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--bg-tertiary)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <ProductImage
          src={src}
          alt={alt}
          fill
          placeholderIconSize={Math.round(size * 0.38)}
        />
      ) : (
        <LuShoppingBag size={Math.round(size * 0.38)} color="var(--text-muted)" aria-hidden />
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);
  function handleClick() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <ProductThumbnail images={product.images} size={52} alt={product.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {product.name}
            </p>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              Rp {product.price?.toLocaleString("id-ID") ?? "-"}
            </p>
          </div>
          {product.reason && (
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginTop: "4px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.reason}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleClick}
        style={{
          width: "100%",
          background: added ? "var(--accent)" : "var(--accent-subtle)",
          color: added ? "#000" : "var(--accent)",
          border: "1px solid rgba(244,121,32,0.25)",
          borderRadius: "var(--radius-sm)",
          padding: "6px 0",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "center",
        }}
      >
        {added ? (
          <IconLabel icon={LuCheck} size={12}>Ditambahkan</IconLabel>
        ) : (
          <IconLabel icon={LuPlus} size={12}>Tambah ke Keranjang</IconLabel>
        )}
      </button>
    </div>
  );
}

function ChatPanel({ onAddToCart }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Hi! Saya SyRa.\nTanya produk yang kamu butuhkan, saya bantu rekomendasikan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", type: "text", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: data.type || "text",
          content: data.message,
          products: data.products || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: "Maaf, terjadi kesalahan.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="chat-panel-inner"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "1px solid rgba(244,121,32,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            <LuBot size={16} color="var(--accent)" aria-hidden />
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              SyRa
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "3px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Asisten Store
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="chat-messages"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "6px",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "8px 12px",
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 3px 14px"
                    : "14px 14px 14px 3px",
                background:
                  msg.role === "user"
                    ? "var(--accent-subtle)"
                    : "var(--bg-tertiary)",
                border: "1px solid",
                borderColor:
                  msg.role === "user"
                    ? "rgba(244,121,32,0.2)"
                    : "var(--border)",
                fontSize: "12px",
                color:
                  msg.role === "user"
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && msg.products?.length > 0 && (
              <div
                style={{
                  width: "88%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {msg.products.map((p, pi) => (
                  <ProductCard key={pi} product={p} onAddToCart={onAddToCart} />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "14px 14px 14px 3px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <style>{`
                @keyframes blink { 0%,100%{opacity:.25} 50%{opacity:1} }
                .dot{animation:blink 1.2s infinite;display:inline-block;}
                .dot:nth-child(2){animation-delay:.2s}
                .dot:nth-child(3){animation-delay:.4s}
              `}</style>
              <span className="dot">●</span> <span className="dot">●</span>{" "}
              <span className="dot">●</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Tanya kebutuhan IoT kamu..."
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "12px",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background:
              input.trim() && !loading
                ? "var(--accent-subtle)"
                : "var(--bg-tertiary)",
            border: "1px solid",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: input.trim() && !loading ? "pointer" : "default",
            color:
              input.trim() && !loading ? "var(--accent)" : "var(--text-muted)",
            borderColor:
              input.trim() && !loading
                ? "rgba(244,121,32,0.25)"
                : "var(--border)",
            transition: "all 0.15s",
          }}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

async function fetchUmkm() {
  const res = await fetch("/api/umkm");
  return res.json();
}

export default function CatalogPage() {
  const [umkmList, setUmkmList] = useState([]);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState("catalog"); // "catalog" | "chat"
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  function readCartSafe() {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cart");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const [cart, setCart] = useState(readCartSafe);
  const [cartReady, setCartReady] = useState(true);

  useEffect(() => {
    fetchUmkm().then(setUmkmList);
  }, []);

  // Sinkron ulang saat cart diubah dari halaman lain (app/umkm/[slug]/page.js
  // menulis langsung ke localStorage, bukan lewat setCart() di sini).
  useEffect(() => {
    function syncCart() {
      const saved = localStorage.getItem("cart");
      setCart(saved ? JSON.parse(saved) : []);
    }
    window.addEventListener("cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  // FIX: dulu effect ini jalan duluan dengan cart=[] SEBELUM load awal di atas
  // selesai (soalnya load-nya async lewat import().then()) — jadi localStorage
  // ketimpa jadi "[]" tiap kali homepage di-mount, menghapus cart yang sudah
  // ditambahkan dari halaman /umkm/[slug]. Guard dengan cartReady biar cuma
  // nulis SETELAH load awal selesai.
  useEffect(() => {
    if (!cartReady) return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, cartReady]);

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists)
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  function removeFromCart(id) {
    setCart((c) => c.filter((x) => x.id !== id));
  }

  function goToCheckout() {
    if (cart.length === 0) {
      alert("Keranjang masih kosong");
      return;
    }
    router.push("/checkout");
  }

  const filteredUmkm = umkmList.filter((u) =>
    u.namaUsaha.toLowerCase().includes(search.toLowerCase()) ||
    u.alamatUsaha.toLowerCase().includes(search.toLowerCase())
  );
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.price ?? 0) * c.qty, 0);

  const CHAT_W = chatCollapsed ? 52 : 300;

  return (
    <div className="catalog-page" style={{ background: "var(--bg-primary)" }}>
      <style>{`
        /* ── desktop layout ── */
        .catalog-page {
          height: calc(100vh - 52px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .main-shell {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* chat panel */
        .chat-panel {
          width: ${CHAT_W}px;
          min-width: ${CHAT_W}px;
          border-right: 1px solid var(--border);
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          min-height: 0;
          height: 100%;
          transition: width 0.25s ease, min-width 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .chat-panel-inner { flex: 1; min-height: 0; }
        .chat-messages { overscroll-behavior: contain; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }
        /* catalog + cart panel */
        .right-panel {
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        /* mobile tab bar */
        .mobile-tabs { display: none; }

        /* ── mobile ── */
        @media (max-width: 767px) {
          .catalog-page { height: auto; overflow: visible; }
          .main-shell { flex-direction: column; flex: none; min-height: auto; overflow: visible; }
          .chat-panel {
            width: 100% !important; min-width: 100% !important;
            border-right: none; border-bottom: 1px solid var(--border);
            height: 72dvh; flex-shrink: 0;
            display: ${mobileTab === "chat" ? "flex" : "none"} !important;
          }
          .right-panel {
            display: ${mobileTab === "catalog" ? "flex" : "none"} !important;
            overflow-y: visible; flex: none;
            padding-bottom: 90px;
          }
          .mobile-tabs { display: flex !important; }
          .collapse-btn { display: none !important; }
          /* tighten banner on mobile */
          .banner-inner { padding: 18px 16px !important; }
          .catalog-area { padding: 0 12px 16px 12px !important; }
          /* native feel: bigger tap targets */
          button { -webkit-tap-highlight-color: transparent; }
          input { font-size: 16px !important; } /* prevent iOS zoom */
        }

        /* product grid */
        .product-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 480px) { .product-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1280px) { .product-grid { grid-template-columns: repeat(3,1fr); } }


        .banner-stats { display: flex; }
        @media (max-width: 640px) { .banner-stats { display: none !important; } }

        /* scrollbar */
        .right-panel::-webkit-scrollbar { width: 4px; }
        .right-panel::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }

        /* ── Floating Cart Button ── */
        .fab-cart {
          position: fixed;
          bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          z-index: 200;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: var(--accent);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(244,121,32,0.4), 0 2px 8px rgba(0,0,0,0.5);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .fab-cart:active { transform: scale(0.92); }
        .fab-cart:hover { transform: scale(1.06); box-shadow: 0 6px 28px rgba(244,121,32,0.55), 0 2px 10px rgba(0,0,0,0.5); }
        .fab-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-primary);
          animation: pop-in 0.25s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes pop-in { from { transform: scale(0); } to { transform: scale(1); } }

        /* ── Cart Drawer ── */
        .cart-overlay {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: fade-in 0.2s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .cart-drawer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;
          background: var(--bg-secondary);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid var(--border);
          padding: 0 0 env(safe-area-inset-bottom, 16px) 0;
          max-height: 80dvh;
          overflow-y: auto;
          animation: slide-up 0.3s cubic-bezier(.32,1,.6,1);
          overscroll-behavior: contain;
        }
        @media (min-width: 768px) {
          .cart-drawer {
            left: auto; bottom: 80px; right: 24px;
            width: 320px;
            border-radius: 16px;
            border: 1px solid var(--border);
            max-height: 70vh;
          }
        }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .cart-drawer-handle {
          width: 36px; height: 4px;
          background: var(--border-light);
          border-radius: 2px;
          margin: 12px auto 0;
        }
        @media (min-width: 768px) { .cart-drawer-handle { display: none; } }
      `}</style>

      {/* ── Mobile tab bar ── */}
      <div
        className="mobile-tabs"
        style={{
          position: "sticky",
          top: "52px",
          zIndex: 40,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          display: "none",
          gap: "0",
        }}
      >
        {["catalog", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "13px",
              fontWeight: 500,
              background:
                mobileTab === tab ? "var(--bg-tertiary)" : "transparent",
              color:
                mobileTab === tab
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "none",
              borderBottom:
                mobileTab === tab
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab === "catalog" ? (
              <IconLabel icon={LuShoppingBag} size={14}>
                Katalog{cartReady && totalItems > 0 ? ` (${totalItems})` : ""}
              </IconLabel>
            ) : (
              <IconLabel icon={LuBot} size={14}>SyRa Chat</IconLabel>
            )}
          </button>
        ))}
      </div>

      {/* ── Floating Cart FAB ── */}
      <button
        className="fab-cart"
        onClick={() => setCartOpen((v) => !v)}
        aria-label={`Keranjang, ${totalItems} item`}
      >
        <LuShoppingBag size={24} color="#fff" aria-hidden />
        {cartReady && totalItems > 0 && (
          <span className="fab-badge" key={totalItems}>{totalItems}</span>
        )}
      </button>

      {/* ── Cart Drawer Overlay ── */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-drawer-handle" />
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>Keranjang</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {totalItems > 0 && (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(244,121,32,0.2)" }}>
                      {totalItems} item
                    </span>
                  )}
                  <button onClick={() => setCartOpen(false)} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              </div>
              {cart.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>Belum ada item di keranjang</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {cart.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {item.price != null ? `Rp ${(item.price * item.qty).toLocaleString("id-ID")}` : "Harga belum tersedia"}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <button
                            onClick={() => item.qty === 1 ? removeFromCart(item.id) : setCart((c) => c.map((x) => x.id === item.id ? { ...x, qty: x.qty - 1 } : x))}
                            style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "15px", fontWeight: 700, background: item.qty === 1 ? "var(--red-subtle)" : "var(--bg-tertiary)", color: item.qty === 1 ? "var(--red)" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >−</button>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                          <button
                            onClick={() => setCart((c) => c.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}
                            style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(244,121,32,0.25)", background: "var(--accent-subtle)", color: "var(--accent)", cursor: "pointer", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
                      <span>Total</span>
                      <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>
                    <button
                      onClick={() => { setCartOpen(false); goToCheckout(); }}
                      style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.2px" }}
                    >Pesan via WhatsApp 🛒</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Main shell ── */}
      <div className="main-shell">
        {/* ── Left: Chat Panel ── */}
        <div className="chat-panel">
          {/* Collapse toggle button */}
          <button
            className="collapse-btn"
            onClick={() => setChatCollapsed((v) => !v)}
            title={chatCollapsed ? "Buka chat" : "Tutup chat"}
            style={{
              position: "absolute",
              top: "50%",
              right: "-12px",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "24px",
              height: "48px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "0 8px 8px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "10px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {chatCollapsed ? <LuChevronRight size={14} /> : <LuChevronLeft size={14} />}
          </button>

          {/* Collapsed state — just icon */}
          {chatCollapsed ? (
            <div
              onClick={() => setChatCollapsed(false)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "8px",
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              <LuBot size={20} color="var(--accent)" aria-hidden />
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  letterSpacing: "1px",
                }}
              >
                SyRa
              </span>
            </div>
          ) : (
            <ChatPanel onAddToCart={addToCart} />
          )}
        </div>

        {/* ── Right: Catalog + Cart ── */}
        <div className="right-panel">
          {/* Banner */}
          <div style={{ padding: "28px 28px 0 28px" }}>
            <div
              className="banner-inner"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 32px",
                marginBottom: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-60px",
                  width: "200px",
                  height: "200px",
                  background: "var(--accent-glow)",
                  borderRadius: "50%",
                  filter: "blur(60px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--accent-subtle)",
                    border: "1px solid rgba(244,121,32,0.2)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    UMKM 
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.5px",
                    marginBottom: "6px",
                  }}
                >
                  KOMUNITAS WISATA KULINER PASISIA
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    maxWidth: "360px",
                    lineHeight: 1.6,
                    marginBottom: "16px",
                  }}
                >
                  BERSAMA PASISIA NIGHT CULINARY
                </p>
                <p> </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    maxWidth: "360px",
                    lineHeight: 1.6,
                    marginBottom: "16px",
                  }}
                >
                  Berita Terkait:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                ><a
                    href="https://www.hariansinggalang.co.id/berita/246220/tim-dosen-unp-laksanakan-pkm-di-painan-beri-pendampingan-transformasi-digital-promosi-umkm-berbasis-potensi-lokal"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      background: "var(--card-bg)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      marginBottom: "12px",
                      transition: "0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--card-bg)";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        Tim Dosen UNP Laksanakan PKM di Painan,
                        Beri Pendampingan Transformasi Digital Promosi UMKM Berbasis Potensi Lokal
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        hariansinggalang.co.id
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://rri.co.id/padang/iptek/2605541/tim-dosen-unp-dampingi-umkm-painan-bertransformasi-digital-untuk-perluas-pasar?nocache=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      background: "var(--card-bg)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      marginBottom: "12px",
                      transition: "0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--card-bg)";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        Tim Dosen UNP Dampingi UMKM Painan Bertransformasi Digital untuk Perluas Pasar
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        rri.co.id
                      </div>
                    </div>
                  </a>

                </div>

                <button
                  onClick={() =>
                    document
                      .getElementById("katalog-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    border: "1px solid rgba(244,121,32,0.25)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 18px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Lihat Produk →
                </button>
              </div>
              <div
                className="banner-stats"
                style={{
                  display: "flex",
                  gap: "28px",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {[
                  { value: items.length, label: "Total Item" },
                  {
                    value: items.filter((i) => i.type === "product").length,
                    label: "Hardware",
                  },
                  {
                    value: items.filter((i) => i.type === "service").length,
                    label: "Layanan",
                  },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-1px",
                      }}
                    >
                      {s.value}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Catalog + Cart area */}
          <div
            id="katalog-section"
            className="catalog-area"
            style={{
              padding: "0 28px 28px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
            }}
          >
            {/* Grid */}
            <div style={{ flex: 1 }}>
              <div style={{ margin: "16px 0" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama usaha atau daerah..."
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              </div>
              <div className="product-grid">
                {filteredUmkm.map((umkm) => (
                  <Link key={umkm.id} href={`/umkm/${umkm.slug}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        height: "100%",
                      }}
                    >
                      {umkm.komunitas && (
                        <span style={{
                          fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                          borderRadius: "20px", background: "var(--accent-subtle)",
                          color: "var(--accent)", border: "1px solid rgba(244,121,32,0.2)",
                          alignSelf: "flex-start",
                        }}>
                          {umkm.komunitas.nama}
                        </span>
                      )}
                      <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                        {umkm.namaUsaha}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {umkm.namaOwner} · {umkm.alamatUsaha}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "auto" }}>
                        {umkm.items?.length || 0} produk
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}