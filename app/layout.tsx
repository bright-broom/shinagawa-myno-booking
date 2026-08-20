import type { Metadata } from "next";
import "./globals.css";

const title = "品川カード予約 | 時間から探せる交付予約";
const description = "品川区内5会場のマイナンバーカード交付予約を、希望日時からまとめて検索できるBright Bloomのサービスコンセプトです。";

const productionHost = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(productionHost),
  title,
  description,
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "品川カード予約 - 空いている時間から、すぐに見つかる。" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
