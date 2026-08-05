"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "../../components/ProductImage";
import { LuShoppingBag, LuPlus, LuCheck, LuMessageCircle } from "../../components/icons";

function waLink(noHpWa, text) {
  return `https://wa.me/${noHpWa}?text=${encodeURIComponent(text)}`;
}

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

function ItemCard({ item, umkm, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const hasPrice = item.price != null;

  function handleAdd() {
    const ok = onAddToCart(item);
    if (ok === false) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const chatText = `Halo ${umkm.namaUsaha}, saya mau tanya/order "${item.name}" yang saya lihat di katalog Pasisia Night Culinary.`;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          style={{
            width: 72,
            height: 72,
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
          {item.images?.[0] ? (
            <ProductImage src={item.images[0]} alt={item.name} fill placeholderIconSize={28} />
          ) : (
            <LuShoppingBag size={28} color="var(--text-muted)" aria-hidden />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.35 }}>
            {item.name}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginTop: "4px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 600, fontSize: "13px", color: hasPrice ? "var(--text-primary)" : "var(--text-muted)" }}>
          {hasPrice ? `Rp ${item.price.toLocaleString("id-ID")}` : "Hubungi penjual"}
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          <a
            href={waLink(umkm.noHpWa, chatText)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid rgba(244,121,32,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
            }}
          >
            <LuMessageCircle size={12} /> Chat
          </a>
          {hasPrice && (
            <button
              onClick={handleAdd}
              style={{
                background: added ? "var(--accent)" : "var(--accent-subtle)",
                color: added ? "#fff" : "var(--accent)",
                border: "1px solid rgba(244,121,32,0.25)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {added ? <LuCheck size={12} /> : "+ Tambah"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UmkmDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [umkm, setUmkm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(readCartSafe);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/umkm/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setUmkm(data.error ? null : data);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    function syncCart() {
      setCart(readCartSafe());
    }
    window.addEventListener("cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const addToCart = useCallback(
    (item) => {
      if (!umkm) return false;
      const currentCart = readCartSafe();
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        umkmId: umkm.id,
        umkmNoHpWa: umkm.noHpWa,
        umkmNamaUsaha: umkm.namaUsaha,
      };
      const existing = currentCart.find((c) => c.id === item.id);
      const updated = existing
        ? currentCart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...currentCart, { ...cartItem, qty: 1 }];

      try {
        localStorage.setItem("cart", JSON.stringify(updated));
      } catch (err) {
        console.error("[cart] gagal menyimpan ke localStorage:", err);
        return false;
      }

      window.dispatchEvent(new Event("cart-updated"));
      setCart(updated);
      return true;
    },
    [umkm],
  );

  function updateQty(id, delta) {
    const updated = cart
      .map((x) => {
        if (x.id === id) {
          const newQty = x.qty + delta;
          return newQty > 0 ? { ...x, qty: newQty } : null;
        }
        return x;
      })
      .filter(Boolean);
    setCart(updated);
    try {
      localStorage.setItem("cart", JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new Event("cart-updated"));
  }

  if (loading) return <div style={{ padding: 28, color: "var(--text-muted)" }}>Memuat...</div>;
  if (!umkm) return <div style={{ padding: 28, color: "var(--text-muted)" }}>UMKM tidak ditemukan.</div>;

  const totalItems = cart.reduce((s, c) => s + (c.qty || 0), 0);
  const totalPrice = cart.reduce((s, c) => s + (c.price ?? 0) * (c.qty || 0), 0);
  const chatTokoText = `Halo ${umkm.namaUsaha}, saya lihat katalog kamu di Pasisia Night Culinary, boleh tanya-tanya?`;

  return (
    <div style={{ padding: "28px 28px 90px 28px", maxWidth: "1100px", margin: "0 auto" }}>
      <style>{`
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

      {/* ── Floating Cart FAB ── */}
      <button
        className="fab-cart"
        onClick={() => setCartOpen((v) => !v)}
        aria-label={`Keranjang, ${totalItems} item`}
      >
        <LuShoppingBag size={24} color="#fff" aria-hidden />
        {totalItems > 0 && (
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
                            onClick={() => updateQty(item.id, -1)}
                            style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "15px", fontWeight: 700, background: item.qty === 1 ? "var(--red-subtle)" : "var(--bg-tertiary)", color: item.qty === 1 ? "var(--red)" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >−</button>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
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
                      onClick={() => { setCartOpen(false); router.push("/checkout"); }}
                      style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.2px" }}
                    >Pesan via WhatsApp 🛒</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Kembali ke katalog UMKM
        </Link>
      </div>

      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginTop: "14px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          {umkm.komunitas && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "20px",
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid rgba(244,121,32,0.2)",
              }}
            >
              {umkm.komunitas.nama}
            </span>
          )}
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px" }}>
            {umkm.namaUsaha}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {umkm.namaOwner} · {umkm.alamatUsaha}
          </p>
        </div>
        <a
          href={waLink(umkm.noHpWa, chatTokoText)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
            border: "1px solid rgba(244,121,32,0.25)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <LuMessageCircle size={14} /> Chat via WhatsApp
        </a>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "12px",
        }}
        className="umkm-item-grid"
      >
        <style>{`
          @media (min-width: 640px) { .umkm-item-grid { grid-template-columns: repeat(2,1fr) !important; } }
          @media (min-width: 1024px) { .umkm-item-grid { grid-template-columns: repeat(3,1fr) !important; } }
        `}</style>
        {umkm.items.map((item) => (
          <ItemCard key={item.id} item={item} umkm={umkm} onAddToCart={addToCart} />
        ))}
      </div>
    </div>
  );
}