import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleSwitcher } from "@/components/atoms/LocaleSwitcher";
import { IntlProvider } from "@/lib/i18n/client";
import { getMessages } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ad-manager",
  description: "Manage your ad campaigns",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getMessages();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <div className="fixed bottom-md right-md z-50">
            <LocaleSwitcher />
          </div>
        </IntlProvider>
      </body>
    </html>
  );
}
