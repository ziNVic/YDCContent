import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "易得康内容初审平台｜市场推广中心",
  description: "面向区域市场投稿前的易得康内容初审核工具。",
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
      <body>{children}</body>
    </html>
  );
}
