import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI机器人助手 - 智能3D对话系统",
  description: "基于智谱AI和Three.js的3D沉浸式AI对话机器人，支持语音交互和实时对话",
  keywords: ["AI", "机器人", "语音交互", "Three.js", "智谱AI"],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
