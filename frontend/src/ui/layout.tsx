import type React from "react"
import { Suspense } from "react"
import "./global.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="font-sans antialiased">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  )
}


