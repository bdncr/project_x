import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project X — Бүтээлчдийн орон зай",
  description: "Монгол бүтээлчдийн шилдэг төслүүдийг нээх, хуваалцах, холбогдох орон зай.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
