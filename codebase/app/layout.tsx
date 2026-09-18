import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SlideAlive — Adaptive Learning",
  description:
    "Turn lecture slides into a learning experience that adapts to you.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
