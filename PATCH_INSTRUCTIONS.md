# Patch konkret untuk file besar (page.js, admin/page.js, checkout/page.js)

File-file ini terlalu besar (600–1300+ baris) untuk ditulis ulang total tanpa
risiko merusak style/layout yang sudah jadi. Berikut patch bagian yang
BENAR-BENAR perlu diubah, sisanya tetap.

---

## 1. `app/page.js` — homepage jadi katalog UMKM (bukan katalog item)

### 1a. Ganti fetch & state utama

CARI (sekitar baris 431–463):
```js
async function fetchItems() {
  const res = await fetch("/api/products");
  return res.json();
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  ...
  useEffect(() => {
    fetchItems().then(setItems);
  }, []);
```

GANTI dengan:
```js
async function fetchUmkm() {
  const res = await fetch("/api/umkm");
  return res.json();
}

export default function CatalogPage() {
  const [umkmList, setUmkmList] = useState([]);
  const [search, setSearch] = useState("");
  ...
  useEffect(() => {
    fetchUmkm().then(setUmkmList);
  }, []);
```

Hapus `filter`/`filtered` (baris ~488, `const filtered = filter === "all" ? ...`)
— filter produk/layanan tidak relevan lagi di level homepage. Ganti dengan:
```js
const filteredUmkm = umkmList.filter((u) =>
  u.namaUsaha.toLowerCase().includes(search.toLowerCase()) ||
  u.alamatUsaha.toLowerCase().includes(search.toLowerCase())
);
```

### 1b. Ganti grid rendering (baris ~1004–1123)

CARI blok `<div className="product-grid">{filtered.map((item) => ( ... ))}</div>`
(seluruh blok Link → Card per Item, termasuk tombol "+ Tambah" dan badge Produk/Layanan).

GANTI isinya dengan grid UmkmCard:
```jsx
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
            color: "var(--accent)", border: "1px solid rgba(74,222,128,0.2)",
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
```

### 1c. Cart sidebar tetap ada, tapi:
- Ganti pemicu update cart. Karena `addToCart` sekarang dipanggil dari halaman
  `/umkm/[slug]` (bukan homepage lagi — homepage tidak render item langsung),
  homepage hanya perlu **membaca** localStorage `cart` dan subscribe ke event
  `cart-updated` yang di-dispatch dari `app/umkm/[slug]/page.js`:

```js
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
```

- Tampilan tiap baris cart (baris ~1190–1223) sekarang punya `item.umkmNamaUsaha`
  — tambahkan label kecil di bawah nama item:
```jsx
<p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{item.umkmNamaUsaha}</p>
```
Ini membantu pembeli sadar cart-nya lintas-toko sebelum checkout dipecah otomatis.

### 1d. ChatPanel (SyRa AI)
Untuk sekarang biarkan apa adanya (masih merekomendasikan berdasar `/api/chat`).
Rekomendasi AI berbasis produk IoT tidak relevan lagi untuk katalog UMKM kuliner
— ini butuh perubahan prompt di `/api/chat/route.js` secara terpisah (di luar
scope migrasi struktur data ini). Kalau mau, saya bisa bantu revisi prompt-nya
di sesi lain.

---

## 2. `app/admin/page.js`

### 2a. Tambah tab baru "UMKM" di sebelah tab produk yang sudah ada
CARI deklarasi tab admin (sekitar baris 183: `const [activeTab, setActiveTab] = useState("orders");`)
dan cari daftar tombol tab-nya (biasanya array `["orders","products",...]` yang
dirender jadi button). Tambahkan `"umkm"` ke array itu, dengan label "UMKM".

### 2b. Komponen baru `UmkmManager` (tempatkan di bawah komponen manajer produk yang sudah ada, ~baris 774 `ProductManager`)
```jsx
function UmkmManager() {
  const [umkmList, setUmkmList] = useState([]);
  const [form, setForm] = useState({ namaOwner: "", namaUsaha: "", alamatUsaha: "", noHpWa: "" });
  const [editId, setEditId] = useState(null);

  async function loadUmkm() {
    const res = await fetch("/api/umkm");
    setUmkmList(await res.json());
  }
  useEffect(() => { loadUmkm(); }, []);

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
    setForm({ namaOwner: "", namaUsaha: "", alamatUsaha: "", noHpWa: "" });
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
        <button onClick={handleSubmit} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "var(--radius-sm)", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {editId ? "Update UMKM" : "Tambah UMKM"}
        </button>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {umkmList.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{u.namaUsaha}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.namaOwner} · {u.alamatUsaha} · {u.items?.length || 0} produk</p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => { setEditId(u.id); setForm(u); }} style={{ fontSize: "11px", cursor: "pointer" }}>Edit</button>
              <button onClick={() => handleDelete(u.id)} style={{ fontSize: "11px", color: "var(--red)", cursor: "pointer" }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2c. Form produk (`ProductManager`, ~baris 774–886) — wajib pilih UMKM
CARI:
```js
const [form, setForm] = useState({ name: "", type: "product", price: "", description: "", longDescription: "", images: [] });
```
GANTI:
```js
const [form, setForm] = useState({ name: "", type: "produk", price: "", description: "", longDescription: "", images: [], umkmId: "" });
const [umkmOptions, setUmkmOptions] = useState([]);
useEffect(() => { fetch("/api/umkm").then((r) => r.json()).then(setUmkmOptions); }, []);
```

CARI baris `<input style={inputStyle} placeholder="Nama produk/layanan" ...`
TAMBAHKAN sebelum input itu:
```jsx
<select style={{ ...inputStyle, cursor: "pointer" }} value={form.umkmId} onChange={(e) => setForm({ ...form, umkmId: e.target.value })}>
  <option value="">Pilih UMKM...</option>
  {umkmOptions.map((u) => (
    <option key={u.id} value={u.id}>{u.namaUsaha}</option>
  ))}
</select>
```

CARI `handleSubmit` produk (~baris 811):
```js
if (!form.name || !form.price || !form.description) { alert("Semua field wajib diisi"); return; }
```
GANTI (harga jadi opsional, umkmId wajib):
```js
if (!form.name || !form.description || !form.umkmId) { alert("Nama, deskripsi, dan UMKM wajib diisi"); return; }
```

---

## 3. `app/checkout/page.js`

Perubahan minimal karena logika split sudah ditangani backend (`/api/orders`).
Yang perlu diubah di frontend:

1. Saat submit checkout, kirim `items` dari cart APA ADANYA (sudah membawa
   `umkmId`, `umkmNoHpWa`, `umkmNamaUsaha` dari `app/umkm/[slug]/page.js`) —
   tidak perlu diubah kalau checkout page sudah generic `POST /api/orders`
   dengan body `{ name, phone, items, total }`.

2. Response sekarang berbentuk:
```json
{ "success": true, "orders": [{ "id": 1, "umkmNamaUsaha": "Bastias", "total": 25000 }, ...], "token": "SRY-XXXXX" }
```
   bukan `{ orderId, token }` tunggal. Cari bagian yang menampilkan konfirmasi
   sukses (biasanya render `Order #${data.orderId}`), ganti jadi:
```jsx
{data.orders.map((o) => (
  <p key={o.id}>📦 {o.umkmNamaUsaha} — Order #{o.id} — Rp {o.total.toLocaleString("id-ID")}</p>
))}
```

3. Tambahkan opsi "Chat langsung tanpa checkout" di halaman keranjang/checkout:
   tombol per grup UMKM yang me-link ke `https://wa.me/{umkmNoHpWa}` dengan
   teks daftar item yang mau ditanyakan — ini melengkapi flow cart, bukan
   menggantinya. Contoh:
```jsx
<a href={`https://wa.me/${group.umkmNoHpWa}?text=${encodeURIComponent(
  `Halo ${group.umkmNamaUsaha}, saya mau tanya soal: ${group.items.map(i => i.name).join(", ")}`
)}`} target="_blank" rel="noopener noreferrer">
  Chat toko ini langsung
</a>
```
