"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductImage from "../../components/ProductImage";

export default function ProductDetailPage() {
  const [item, setItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
      });
  }, [id]);

  function addToCartAndCheckout() {
    const cart = [{ ...item, qty: 1 }];
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/checkout");
  }

  function addToCart() {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const found = existing.find((c) => c.id === item.id);
    if (found) {
      found.qty += 1;
    } else {
      existing.push({ ...item, qty: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    router.back(); // pakai back() bukan push('/') supaya tidak reload penuh
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Memuat...
        </p>
      </div>
    );

  if (!item)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Produk tidak ditemukan
        </p>
      </div>
    );

  const images = item.images?.length > 0 ? item.images : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "28px 40px",
      }}
    >
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          borderRadius: "var(--radius-sm)",
          padding: "6px 14px",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        ← Kembali
      </button>

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        {/* Gambar */}
        <div style={{ flex: "0 0 420px", maxWidth: "100%" }}>
          {images ? (
            <div>
              {/* Main image */}
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  marginBottom: "10px",
                  aspectRatio: "4/3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <ProductImage
                  src={images[selectedImage]}
                  alt={item.name}
                  fill
                  placeholderIconSize={32}
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        border: `1px solid ${selectedImage === i ? "var(--accent)" : "var(--border)"}`,
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <ProductImage src={img} alt="" fill placeholderIconSize={18} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Placeholder kalau tidak ada gambar
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                aspectRatio: "4/3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Belum ada gambar
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: "4px",
              background:
                item.type === "product"
                  ? "var(--blue-subtle)"
                  : "var(--accent-subtle)",
              color: item.type === "product" ? "var(--blue)" : "var(--accent)",
              border: `1px solid ${item.type === "product" ? "rgba(96,165,250,0.2)" : "rgba(244,121,32,0.2)"}`,
            }}
          >
            {item.type === "product" ? "Produk" : "Layanan"}
          </span>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "12px 0 8px",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            {item.name}
          </h1>

          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--accent)",
              marginBottom: "20px",
              letterSpacing: "-0.5px",
            }}
          >
            Rp {item.price.toLocaleString("id-ID")}
          </p>

          {/* Deskripsi singkat */}
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "16px",
            }}
          >
            {item.description}
          </p>

          {/* Deskripsi panjang */}
          {item.longDescription && (
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Detail Produk
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.longDescription}
              </p>
            </div>
          )}

          {/* Tombol */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={addToCartAndCheckout}
              style={{
                background: "var(--accent)",
                color: "#000",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Pesan Sekarang
            </button>
            <button
              onClick={addToCart}
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              + Tambah ke Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
