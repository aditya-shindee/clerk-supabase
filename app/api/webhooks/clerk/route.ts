import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { supabase } from "@/lib/supabase"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  const wh = new Webhook(webhookSecret)
  let evt: any

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  const eventType = evt.type
  console.log("Webhook event type:", eventType)

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url, created_at, last_sign_in_at } = evt.data

      const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id)

      const userData = {
        clerk_user_id: id,
        email: primaryEmail?.email_address || "",
        first_name: first_name || null,
        last_name: last_name || null,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
        ...(eventType === "user.created" && {
          created_at: new Date(created_at).toISOString(),
        }),
        ...(last_sign_in_at && {
          last_sign_in_at: new Date(last_sign_in_at).toISOString(),
        }),
      }

      const { error } = await supabase.from("user_profiles").upsert(userData, {
        onConflict: "clerk_user_id",
      })

      if (error) {
        console.error("Error syncing user to Supabase:", error)
        return NextResponse.json({ error: "Failed to sync user" }, { status: 500 })
      }

      console.log("User synced successfully:", userData)
    }

    // Handle session created event (when user signs in)
    if (eventType === "session.created") {
      const { user_id } = evt.data

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", user_id)

      if (error) {
        console.error("Error updating last sign in:", error)
        return NextResponse.json({ error: "Failed to update sign in time" }, { status: 500 })
      }

      console.log("Last sign in updated for user:", user_id)
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data

      const { error } = await supabase.from("user_profiles").delete().eq("clerk_user_id", id)

      if (error) {
        console.error("Error deleting user from Supabase:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
      }

      console.log("User deleted successfully:", id)
    }

    return NextResponse.json({ message: "Webhook processed successfully" })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
