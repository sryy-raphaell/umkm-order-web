import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "SyRa Store - SRYY Team Katalog",
  description: "Katalog produk dan layanan IoT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
} 