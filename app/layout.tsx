import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/AuthProvider";

export const metadata: Metadata = {
  title: "Project X — Бүтээлчдийн орон зай",
  description: "Монгол бүтээлчдийн шилдэг төслүүдийг нээх, хуваалцах, холбогдох орон зай.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
