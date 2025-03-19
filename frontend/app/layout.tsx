import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TravelProvider } from './context/TravelContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Travel Agent - Your Personal Travel Planner",
  description: "Plan your perfect trip with our AI-powered travel assistant. Get personalized travel recommendations and itineraries based on your preferences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <TravelProvider>
          {children}
        </TravelProvider>
      </body>
    </html>
  );
}
