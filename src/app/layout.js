import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import RootNavbar from "@/components/RootNavbar";
import Script from "next/script";

export const metadata = {
  title: "Pallihaat - Direct from Farm to Table",
  description: "Fresh products directly from local farmers and producers",
};

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import LocaleProvider from "@/components/LocaleProvider";
import LocationCapture from "@/components/LocationCapture";

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <LocaleProvider>
          <LocationCapture />
          <RootNavbar />
          {children}
        </LocaleProvider>
        <ToastContainer position="top-right" autoClose={2000} />
        {/* Preload Razorpay checkout script globally to ensure availability */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}