import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type AddTripMemberRequest = {
  trip_id?: string
  display_name?: string | null
  email?: string | null
  phone?: string | null
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/** Strip to E.164 digits with leading + (8–15 digits after country code). */
function normalizeToE164(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const noSpaces = trimmed.replace(/\s/g, "")
  const digitsOnly = noSpaces.startsWith("+")
    ? "+" + noSpaces.slice(1).replace(/\D/g, "")
    : "+" + noSpaces.replace(/\D/g, "")
  const afterPlus = digitsOnly.slice(1)
  if (afterPlus.length < 8 || afterPlus.length > 15) return null
  return digitsOnly
}

function whatsappAddress(e164: string): string {
  return e164.startsWith("whatsapp:") ? e164 : `whatsapp:${e164}`
}

function labelForAddedBy(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): string {
  const meta = user.user_metadata ?? {}
  for (const key of ["full_name", "name", "display_name"] as const) {
    const v = meta[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  if (user.email?.trim()) return user.email.trim()
  return "Someone"
}

async function sendWhatsappTripInvite(opts: {
  accountSid: string
  authToken: string
  fromRaw: string
  toE164: string
  tripTitle: string | null
  addedByLabel: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = whatsappAddress(
    opts.fromRaw.startsWith("whatsapp:") ? opts.fromRaw : normalizeToE164(opts.fromRaw) ?? opts.fromRaw,
  )
  const to = whatsappAddress(opts.toE164)

  const titlePart = opts.tripTitle?.trim() ? `"${opts.tripTitle.trim()}"` : "a trip"
  const by = opts.addedByLabel.trim() || "Someone"
  const body = `You've been added to ${titlePart} on Triplynx by ${by}.`

  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`
  const credentials = btoa(`${opts.accountSid}:${opts.authToken}`)

  const params = new URLSearchParams({ To: to, From: from, Body: body })

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    return { ok: false, error: text || `${res.status} ${res.statusText}` }
  }
  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or service role key (SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY).",
      )
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser()

    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const payload = (await req.json()) as AddTripMemberRequest
    const tripId = payload.trip_id?.trim() ?? ""

    if (!tripId || !isUuid(tripId)) {
      return new Response(JSON.stringify({ error: "Valid trip_id (UUID) is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const displayName = payload.display_name?.trim() || null
    const email = payload.email?.trim() || null
    const phone = payload.phone?.trim() || null

    if (!displayName && !email && !phone) {
      return new Response(
        JSON.stringify({ error: "At least one of display_name, email, or phone is required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id, created_by, title")
      .eq("id", tripId)
      .maybeSingle()

    if (tripError) {
      throw new Error(tripError.message)
    }

    if (!trip) {
      return new Response(JSON.stringify({ error: "Trip not found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      })
    }

    if (trip.created_by !== user.id) {
      return new Response(JSON.stringify({ error: "You can only add members to your own trips." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      })
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("trip_members")
      .insert({
        trip_id: tripId,
        added_by: user.id,
        display_name: displayName,
        email,
        phone,
      })
      .select(
        "id, trip_id, added_by, display_name, email, phone, created_at, updated_at",
      )
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    let whatsapp_notification: { sent: boolean; error?: string } | undefined

    if (phone) {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim()
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim()
      const fromRaw = Deno.env.get("TWILIO_WHATSAPP_FROM")?.trim()

      const toE164 = normalizeToE164(phone)
      if (!accountSid || !authToken || !fromRaw) {
        whatsapp_notification = {
          sent: false,
          error: "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM.",
        }
      } else if (!toE164) {
        whatsapp_notification = {
          sent: false,
          error: "Phone number could not be normalized to E.164 for WhatsApp.",
        }
      } else {
        const tripTitle = trip?.title ?? null
        const result = await sendWhatsappTripInvite({
          accountSid,
          authToken,
          fromRaw,
          toE164,
          tripTitle,
          addedByLabel: labelForAddedBy(user),
        })
        whatsapp_notification = result.ok
          ? { sent: true }
          : { sent: false, error: result.error }
      }
    }

    return new Response(
      JSON.stringify({
        member: data,
        ...(whatsapp_notification !== undefined && { whatsapp_notification }),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
