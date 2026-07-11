import type { Metadata } from "next";
import "./theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBEA Student Council Budget Transparency Portal",
  description: "Public record of the CSU-Aparri College of Business, Economics, and Accountancy Student Council funds collected and spent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-on-background font-body-sm min-h-screen selection:bg-primary selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
