# 🛍️ SyRa Store

Platform e-commerce full-stack dengan integrasi IoT, AI Chatbot, dan WhatsApp Bot — dibangun menggunakan Next.js, Prisma, PostgreSQL, Ollama, dan ESP32.

---

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Prasyarat](#prasyarat)
- [Instalasi & Konfigurasi](#instalasi--konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Direktori](#struktur-direktori)
- [Dokumentasi API](#dokumentasi-api)
- [Skema Database](#skema-database)
- [Panduan Fitur](#panduan-fitur)
- [Troubleshooting](#troubleshooting)

---

## Fitur Utama

| Fitur              | Deskripsi                                                          |
| ------------------ | ------------------------------------------------------------------ |
| 🛒 Katalog Produk  | Browsing, filter, dan detail produk dengan galeri gambar           |
| 🤖 AI Chatbot      | Rekomendasi produk berbasis LLM (Ollama llama3.1)                  |
| 💬 WhatsApp Bot    | Notifikasi order & negosiasi harga via WhatsApp (Baileys)          |
| 🔧 Admin Panel     | Manajemen produk, order, upload gambar, dan penawaran harga        |
| 📡 IoT Dashboard   | Monitoring sensor ESP32 (suhu, kelembaban, relay) secara real-time |
| 🔌 Kontrol Relay   | Toggle relay ESP32 langsung dari dashboard web                     |
| 💰 Negosiasi Harga | Sistem penawaran harga antara admin dan pelanggan                  |

---

## Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **React** (Hooks, Client & Server Components)
- **Tailwind CSS**

### Backend

- **Next.js Route Handlers** (API)
- **Prisma ORM**
- **PostgreSQL** (Neon cloud / lokal)

### Layanan Eksternal

- **Ollama** — Local LLM (llama3.1:8b) untuk AI chatbot
- **Baileys** — WhatsApp Bot (Node.js, port 3002)

### Hardware

- **ESP32** — mikrokontroler dengan sensor DHT11/22 dan relay 4-channel

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                    │
│  Katalog │ Checkout │ Admin │ Dashboard IoT │ Chatbot   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Request
┌────────────────────▼────────────────────────────────────┐
│                  API LAYER (Route Handlers)              │
│  /api/products  /api/orders  /api/chat  /api/iot/*      │
└──────┬─────────────┬──────────────┬──────────────────────┘
       │             │              │
  ┌────▼───┐   ┌─────▼──────┐  ┌───▼──────────┐
  │Prisma  │   │ Ollama LLM │  │  WA Bot      │
  │  ORM   │   │ :11434     │  │  :3002       │
  └────┬───┘   └────────────┘  └──────────────┘
       │
┌──────▼──────────────────┐
│   PostgreSQL (Neon)     │
│  Item │ User │ Order    │
│  Project │ IotData      │
└─────────────────────────┘

     ESP32 ──── HTTP POST ────▶ /api/iot/update
```

---

## Prasyarat

Pastikan semua tools berikut sudah terinstal:

| Tool       | Versi Minimum | Keterangan                       |
| ---------- | ------------- | -------------------------------- |
| Node.js    | v18+          | [nodejs.org](https://nodejs.org) |
| npm / yarn | latest        | package manager                  |
| PostgreSQL | v14+          | lokal atau Neon cloud            |
| Ollama     | latest        | [ollama.com](https://ollama.com) |
| Git        | latest        | version control                  |

---

## Instalasi & Konfigurasi

### 1. Clone Repository

```bash
git clone https://github.com/sryy-raphaell/order-web.git
cd order-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di root project:

```env
# ─── DATABASE ────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
# Contoh Neon: postgresql://rafael:pass@ep-xxx.neon.tech/syrastore?sslmode=require

# ─── WHATSAPP BOT ────────────────────────────────────────
WA_BOT_URL="http://localhost:3002"

# ─── OLLAMA ──────────────────────────────────────────────
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# ─── APP ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# (Opsional) Lihat database via Prisma Studio
npx prisma studio
```

### 5. Install Model Ollama

```bash
# Pull model LLM (sekitar 4.7 GB)
ollama pull llama3.1:8b

# Verifikasi model tersedia
ollama list
```

### 6. Setup WhatsApp Bot

```bash
# Masuk ke direktori WA bot
cd wa-bot

# Install dependencies bot
npm install

# Jalankan bot (scan QR di terminal untuk login)
node index.js
```

> **Catatan:** Setelah scan QR WhatsApp, sesi tersimpan otomatis. Bot berjalan di port `3002`.

---

## Menjalankan Aplikasi

### Mode Development

Jalankan semua layanan secara berurutan:

**Terminal 1 — Ollama LLM:**

```bash
ollama serve
```

**Terminal 2 — WhatsApp Bot:**

```bash
cd wa-bot && node index.js
```

**Terminal 3 — Next.js App:**

```bash
npm run dev
```

Aplikasi tersedia di: **http://localhost:3000**

---

### Mode Production

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm start
```

---

### Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel dashboard
# Settings → Environment Variables → tambahkan semua dari .env
```

> **Penting:** Ollama dan WA Bot tidak bisa di-deploy ke Vercel karena berjalan lokal. Gunakan VPS terpisah atau Railway untuk kedua layanan tersebut.

---

## Struktur Direktori

```
order-web/
├── app/                          # Next.js App Router
│   ├── page.js                   # Halaman katalog produk
│   ├── checkout/
│   │   └── page.js               # Halaman checkout
│   ├── admin/
│   │   └── page.js               # Panel admin
│   ├── product/
│   │   └── [id]/
│   │       └── page.js           # Detail produk
│   ├── dashboard/
│   │   ├── page.js               # Daftar project IoT
│   │   └── [id]/
│   │       └── page.js           # Detail project IoT
│   └── api/                      # Route Handlers
│       ├── products/
│       │   ├── route.js          # GET, POST
│       │   └── [id]/route.js     # GET, PUT, DELETE
│       ├── orders/
│       │   ├── route.js          # GET, POST
│       │   └── [id]/
│       │       ├── route.js      # GET, PATCH, DELETE
│       │       └── offer/route.js# POST, PATCH (negosiasi)
│       ├── admin/
│       │   └── orders/route.js   # GET semua order
│       ├── chat/route.js         # POST → Ollama
│       ├── relay/route.js        # POST → kontrol relay
│       ├── upload/route.js       # POST → upload gambar
│       └── iot/
│           ├── projects/
│           │   ├── route.js      # GET, POST
│           │   └── [id]/route.js # GET, PATCH, DELETE
│           └── update/route.js   # POST (dari ESP32)
│
├── components/
│   ├── Chatbot.js                # Komponen AI chatbot
│   ├── Navbar.js                 # Navigasi
│   └── ProductImage.js           # Galeri gambar produk
│
├── prisma/
│   ├── schema.prisma             # Skema database
│   └── migrations/               # File migrasi
│
├── public/
│   └── uploads/                  # Gambar produk yang diupload
│
├── wa-bot/                       # WhatsApp Bot (Baileys)
│   └── index.js
│
├── .env                          # Environment variables (tidak di-commit)
├── .env.example                  # Template environment variables
├── next.config.js
├── package.json
└── README.md
```

---

## Dokumentasi API

### Products

| Method   | Endpoint             | Deskripsi          | Body                                         |
| -------- | -------------------- | ------------------ | -------------------------------------------- |
| `GET`    | `/api/products`      | Ambil semua produk | —                                            |
| `POST`   | `/api/products`      | Tambah produk baru | `{name, type, price, description, images[]}` |
| `GET`    | `/api/products/[id]` | Detail produk      | —                                            |
| `PUT`    | `/api/products/[id]` | Update produk      | `{name, type, price, ...}`                   |
| `DELETE` | `/api/products/[id]` | Hapus produk       | —                                            |

### Orders

| Method   | Endpoint                | Deskripsi              | Body                                     |
| -------- | ----------------------- | ---------------------- | ---------------------------------------- |
| `POST`   | `/api/orders`           | Buat order baru        | `{name, phone, address, items[], total}` |
| `GET`    | `/api/orders?phone=xxx` | Cari order by nomor HP | —                                        |
| `GET`    | `/api/orders?lid=xxx`   | Cari order by link ID  | —                                        |
| `PATCH`  | `/api/orders/[id]`      | Update status order    | `{status}`                               |
| `DELETE` | `/api/orders/[id]`      | Hapus order            | —                                        |

**Status Order — Produk:**
`pending` → `pembayaran` → `pengiriman` → `selesai`

**Status Order — Layanan:**
`pending` → `negosiasi` → `pembayaran` → `pembuatan` → `pengiriman` → `selesai`

### Penawaran Harga

| Method  | Endpoint                 | Deskripsi        | Body                                    |
| ------- | ------------------------ | ---------------- | --------------------------------------- |
| `POST`  | `/api/orders/[id]/offer` | Ajukan penawaran | `{price, from}`                         |
| `PATCH` | `/api/orders/[id]/offer` | Terima / tolak   | `{action: "accept"\|"reject", offerId}` |

### Chat (AI)

| Method | Endpoint    | Deskripsi         | Body                   |
| ------ | ----------- | ----------------- | ---------------------- |
| `POST` | `/api/chat` | Kirim pesan ke AI | `{message, history[]}` |

**Response format:**

```json
{
  "action": "recommendation",
  "message": "Berdasarkan kebutuhan Anda...",
  "products": [{ "id": 1, "name": "...", "price": 50000 }]
}
```

### IoT

| Method   | Endpoint                 | Deskripsi                 | Body                                                           |
| -------- | ------------------------ | ------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/iot/projects`      | Daftar project IoT        | —                                                              |
| `POST`   | `/api/iot/projects`      | Buat project baru         | `{name, description}`                                          |
| `PATCH`  | `/api/iot/projects/[id]` | Update project / widgets  | `{name, widgets}`                                              |
| `DELETE` | `/api/iot/projects/[id]` | Hapus project             | —                                                              |
| `POST`   | `/api/iot/update`        | Kirim data sensor (ESP32) | `{authToken, deviceName, temperature, humidity, pins, relays}` |
| `POST`   | `/api/relay`             | Toggle relay              | `{deviceName, channel, state}`                                 |

### Upload

| Method | Endpoint      | Deskripsi            | Body                         |
| ------ | ------------- | -------------------- | ---------------------------- |
| `POST` | `/api/upload` | Upload gambar produk | `multipart/form-data {file}` |

---

## Skema Database

### Model `Item` (Produk)

```prisma
model Item {
  id              Int      @id @default(autoincrement())
  name            String
  type            String   // "produk" | "layanan"
  price           Int
  description     String
  longDescription String?
  images          String[]
  createdAt       DateTime @default(now())
}
```

### Model `User` (Pelanggan)

```prisma
model User {
  id          Int      @id @default(autoincrement())
  phone       String   @unique
  lid         String?  @unique   // link ID untuk WA bot
  linkToken   String?  @unique
  name        String
  createdAt   DateTime @default(now())
  orders      Order[]
}
```

### Model `Order`

```prisma
model Order {
  id               Int      @id @default(autoincrement())
  userId           Int
  user             User     @relation(fields: [userId], references: [id])
  items            Json     // snapshot produk saat order
  total            Int
  negotiatedPrice  Int?
  priceOffers      Json     @default("[]")
  status           String   @default("pending")
  note             String?
  createdAt        DateTime @default(now())
}
```

### Model `Project` (IoT Project)

```prisma
model Project {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  authToken   String    @unique @default(cuid())
  widgets     Json      @default("[]")
  createdAt   DateTime  @default(now())
  devices     IotData[]
}
```

### Model `IotData` (Data Sensor ESP32)

```prisma
model IotData {
  id          Int      @id @default(autoincrement())
  deviceName  String   @unique
  projectId   Int?
  project     Project? @relation(fields: [projectId], references: [id])
  status      String   @default("online")
  temperature Float    @default(0)
  humidity    Float    @default(0)
  pins        Json     @default("{}")
  relays      Json     @default("{}")
  relay       Boolean  @default(false)
  updatedAt   DateTime @updatedAt
}
```

**Relasi:**

- `User` 1 → N `Order`
- `Project` 1 → N `IotData`

---

## Panduan Fitur

### Menghubungkan WhatsApp ke Akun

1. Buka halaman checkout, masukkan nomor HP
2. Kirim `!link` ke nomor WhatsApp bot
3. Bot akan membalas link verifikasi
4. Klik link → akun terhubung
5. Selanjutnya notifikasi order masuk otomatis via WA

### Perintah WhatsApp Bot

| Perintah         | Fungsi                                 |
| ---------------- | -------------------------------------- |
| `!link`          | Dapatkan link untuk menghubungkan akun |
| `!verify`        | Verifikasi nomor HP                    |
| `!status`        | Cek status order terakhir              |
| `!histori`       | Riwayat semua order                    |
| `!tawar [harga]` | Ajukan penawaran harga                 |
| `!terima`        | Terima penawaran dari admin            |
| `!tolak`         | Tolak penawaran dari admin             |

### Konfigurasi ESP32

Upload sketch Arduino berikut ke ESP32:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

const char* ssid       = "WIFI_SSID";
const char* password   = "WIFI_PASSWORD";
const char* serverUrl  = "http://YOUR_SERVER/api/iot/update";
const char* authToken  = "TOKEN_DARI_PROJECT_DASHBOARD";
const char* deviceName = "esp32-001";

DHT dht(4, DHT22); // GPIO 4

void loop() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"authToken\":\"" + String(authToken) + "\","
                "\"deviceName\":\"" + String(deviceName) + "\","
                "\"temperature\":" + temp + ","
                "\"humidity\":"    + hum  + "}";

  int code = http.POST(body);
  // parse response untuk relay state
  http.end();

  delay(5000); // kirim tiap 5 detik
}
```

---

## Troubleshooting

### ❌ Error: `Can't reach database server`

- Pastikan `DATABASE_URL` di `.env` sudah benar
- Cek koneksi internet jika menggunakan Neon
- Jalankan `npx prisma migrate dev` ulang

### ❌ Error: `Ollama connection refused`

```bash
# Pastikan Ollama berjalan
ollama serve

# Cek model sudah ada
ollama list

# Pull ulang jika belum ada
ollama pull llama3.1:8b
```

### ❌ WhatsApp Bot tidak merespons

```bash
# Restart bot dan scan ulang QR
cd wa-bot
rm -rf auth_info_baileys/  # hapus sesi lama
node index.js              # scan QR baru
```

### ❌ Hydration error di halaman Checkout

Pastikan komponen yang mengakses `localStorage` atau data browser dibungkus dengan `mounted` state:

```js
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### ❌ ESP32 tidak terkirim ke server

- Pastikan `authToken` sesuai dengan yang ada di Project Dashboard
- Cek URL server sudah bisa diakses dari jaringan ESP32
- Gunakan `http://` bukan `https://` jika server lokal tanpa SSL

---

## 🌐 Link

- **Aplikasi (Vercel):** [order-web-dun.vercel.app](https://order-web-dun.vercel.app)
- **Repository:** [github.com/sryy-raphaell/order-web](https://github.com/sryy-raphaell/order-web)

---

## 📄 Lisensi

Project ini dibuat untuk keperluan akademik — Mata Kuliah Pemrograman Web.

---

_Dibuat dengan menggunakan Next.js + Prisma + Ollama + Baileys + ESP32_
