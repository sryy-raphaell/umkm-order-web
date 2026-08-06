"use client";
import { useState, useRef, useEffect } from "react";

export default function Chatbot({ onAddToCart }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Hi! Saya SyRa, asisten Store. Menu ini sedang dalam tahap maintenance.",
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

    const userMessage = { role: "user", type: "text", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Kirim hanya role + content ke API (format Ollama)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      // data bisa: { type: 'text', message } | { type: 'recommendation'|'add_to_cart', message, products }
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
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleAddToCart(product) {
    if (onAddToCart) {
      onAddToCart(product);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        display: "flex",
        flexDirection: "column",
        height: "500px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 6px var(--accent)",
          }}
        />
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          SyRa
        </p>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Asisten Store
        </span>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
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
            {/* Bubble teks */}
            <div
              style={{
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 2px 12px"
                    : "12px 12px 12px 2px",
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
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>

            {/* Kartu produk dengan tombol + Tambah */}
            {msg.role === "assistant" &&
              msg.products &&
              msg.products.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    width: "100%",
                    maxWidth: "85%",
                  }}
                >
                  {msg.products.map((product, pi) => (
                    <ProductCard
                      key={pi}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
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
                borderRadius: "12px 12px 12px 2px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <style>{`
                @keyframes blink {
                  0%, 100% { opacity: 0.3 }
                  50% { opacity: 1 }
                }
                .dot { animation: blink 1.2s infinite; display: inline-block; }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
              `}</style>
              <span className="dot">●</span>
              <span className="dot">●</span>
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
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya kebutuhan kamu..."
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 12px",
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
            borderColor:
              input.trim() && !loading
                ? "rgba(244,121,32,0.25)"
                : "var(--border)",
            color:
              input.trim() && !loading ? "var(--accent)" : "var(--text-muted)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 12px",
            fontSize: "12px",
            cursor: input.trim() && !loading ? "pointer" : "default",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

// Komponen kartu produk terpisah
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
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Nama + harga */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
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

      {/* Reason — dibatasi 2 baris */}
      {product.reason && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.reason}
        </p>
      )}

      {/* Tombol */}
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
        {added ? "✓ Ditambahkan ke Keranjang" : "+ Tambah ke Keranjang"}
      </button>
    </div>
  );
}
