"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "../../components/ProductImage";
import { LuShoppingBag, LuPlus, LuCheck, LuMessageCircle } from "../../components/icons";

function waLink(noHpWa, text) {
  return `https://wa.me/${noHpWa}?text=${encodeURIComponent(text)}`;
}

// Baca cart dari localStorage dengan aman — kalau datanya korup/format lama,
// reset ke [] daripada throw dan bikin seluruh handler berhenti diam-diam.
function readCartSafe() {
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
    if (ok === false) return; // gagal, jangan kasih feedback sukses palsu
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
                color: added ? "#000" : "var(--accent)",
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
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch(`/api/umkm/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setUmkm(data.error ? null : data);
        setLoading(false);
      });
  }, [slug]);

  // Badge kecil biar ada feedback visual PERSISTEN di halaman ini juga
  // (bukan cuma centang 2 detik di tombol), sekaligus bantu debug.
  useEffect(() => {
    setCartCount(readCartSafe().reduce((s, c) => s + (c.qty || 0), 0));
  }, []);

  const addToCart = useCallback(
    (item) => {
      if (!umkm) {
        console.warn("[cart] umkm belum siap, add dibatalkan");
        return false;
      }
      const cart = readCartSafe();
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        umkmId: umkm.id,
        umkmNoHpWa: umkm.noHpWa,
        umkmNamaUsaha: umkm.namaUsaha,
      };
      const existing = cart.find((c) => c.id === item.id);
      const updated = existing
        ? cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...cart, { ...cartItem, qty: 1 }];

      try {
        localStorage.setItem("cart", JSON.stringify(updated));
      } catch (err) {
        console.error("[cart] gagal menyimpan ke localStorage:", err);
        return false;
      }

      window.dispatchEvent(new Event("cart-updated"));
      setCartCount(updated.reduce((s, c) => s + (c.qty || 0), 0));
      console.log("[cart] item ditambahkan:", cartItem, "→ cart sekarang:", updated);
      return true;
    },
    [umkm],
  );

  if (loading) return <div style={{ padding: 28, color: "var(--text-muted)" }}>Memuat...</div>;
  if (!umkm) return <div style={{ padding: 28, color: "var(--text-muted)" }}>UMKM tidak ditemukan.</div>;

  const chatTokoText = `Halo ${umkm.namaUsaha}, saya lihat katalog kamu di Pasisia Night Culinary, boleh tanya-tanya?`;

  return (
    <div style={{ padding: "28px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Kembali ke katalog UMKM
        </Link>
        {/* Badge cart persisten — kalau ini angkanya naik pas kamu klik +Tambah,
            berarti localStorage-nya BENAR kesimpan, dan masalahnya cuma di homepage
            yang gagal sinkron. Kalau angkanya TIDAK naik, masalahnya di sini. */}
        <Link
          href="/checkout"
          style={{
            fontSize: "12px",
            color: "var(--accent)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <LuShoppingBag size={14} /> Keranjang ({cartCount})
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