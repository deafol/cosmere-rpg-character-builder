import type { Metadata } from "next";
import Script from 'next/script';
import { Cinzel, Lato, Lora } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cosmere RPG Character Builder",
  description: "A character builder for the Cosmere RPG",
};

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {UMAMI_WEBSITE_ID && UMAMI_URL && (
          <Script
            defer
            src={`${UMAMI_URL}/script.js`}
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${lato.variable} ${cinzel.variable} ${lora.variable} antialiased bg-[#f4ede0] text-[#051435]`}
      >
        {children}
      </body>
    </html>
  );
}
