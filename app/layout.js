import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "KOMUNITAS WISATA KULINER PASISIA",
  description: "BERSAMA PASISIA NIGHT CULINARY",
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