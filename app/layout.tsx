import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "阿绒的电视梦境",
  description: "从复古电视开机进入阿绒的针线盒世界。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
