import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
// import Link from "next/link"
import Footer from "@/components/Footer"
import AudioProvider from "@/contexts/AudioProvider"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Wargrave Cyber Defence Game",
  description: "Try out this Tower Defence Cyber Security Game",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AudioProvider>
          {children}
        </AudioProvider>
        <Footer />
      </body>
    </html>
  )
}

