import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OLX AI Sales Operating System",
  description: "AI-driven Sales OS for OLX Mobile Phone Dealers — maximize conversions with AI-powered intent analysis, lead scoring, and persuasive reply generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
