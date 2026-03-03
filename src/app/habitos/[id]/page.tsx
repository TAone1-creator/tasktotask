'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HabitDetailPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to habits list — detail managed inline
    router.push('/habitos')
  }, [router])

  return null
}
