import type { Metadata } from "next";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wyatt Woodby",
  description: "Wyatt Woodby",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <DialRoot />
      </body>
    </html>
  );
}
