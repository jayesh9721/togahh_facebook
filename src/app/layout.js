import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "HealPoint AI — Healthcare Ads Manager",
  description:
    "Professional AI-powered advertising and marketing automation for hospitals, clinics, and healthcare providers. Managed campaigns, competitor clinical analysis, and patient growth automation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
