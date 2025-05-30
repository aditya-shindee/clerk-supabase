"use client"

import { useEffect, useState } from "react"
import { useSignIn, useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyMagicLink() {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp } = useSignUp()
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const router = useRouter()

  useEffect(() => {
    if (!signInLoaded || !signUpLoaded) return

    const verifyMagicLink = async () => {
      try {
        // First try to complete sign-in
        try {
          const signInResult = await signIn.attemptFirstFactor({
            strategy: "email_link",
          })

          if (signInResult.status === "complete") {
            await setActive({ session: signInResult.createdSessionId })
            setVerificationStatus("success")
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
            return
          }
        } catch (signInError: any) {
          // If sign-in fails, try sign-up completion
          try {
            const signUpResult = await signUp.attemptEmailAddressVerification({
              strategy: "email_link",
            })

            if (signUpResult.status === "complete") {
              await setActive({ session: signUpResult.createdSessionId })
              setVerificationStatus("success")
              setTimeout(() => {
                router.push("/dashboard")
              }, 2000)
              return
            }
          } catch (signUpError: any) {
            console.error("Sign-up verification failed:", signUpError)
          }
        }

        setVerificationStatus("error")
      } catch (err) {
        console.error("Magic link verification failed:", err)
        setVerificationStatus("error")
      }
    }

    verifyMagicLink()
  }, [signInLoaded, signUpLoaded, signIn, signUp, setActive, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            {verificationStatus === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your magic link</h2>
                <p className="text-gray-600">Please wait while we sign you in...</p>
              </>
            )}

            {verificationStatus === "success" && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully signed in!</h2>
                <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
              </>
            )}

            {verificationStatus === "error" && (
              <>
                <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h2>
                <p className="text-gray-600 mb-4">
                  The magic link may have expired or is invalid. Please try signing in again.
                </p>
                <Link href="/sign-in">
                  <Button className="w-full">Back to sign in</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
