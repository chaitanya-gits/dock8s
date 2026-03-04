import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Docker & Kubernetes — Deep Architecture",
  description: "A ruthlessly honest, kernel-to-cluster breakdown of Docker and Kubernetes. Every syscall, every reconciliation loop, every deployment manifested.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=JetBrains+Mono:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
