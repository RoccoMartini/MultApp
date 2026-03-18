'use client'
import './globals.css'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!role && pathname !== '/login') {
      router.push('/login')
    }
  }, [role, pathname, router])

  if (!role && pathname !== '/login') return null

  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}