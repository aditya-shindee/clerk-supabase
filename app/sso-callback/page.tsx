"use client"

import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    handleRedirectCallback()
  }, [handleRedirectCallback])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
