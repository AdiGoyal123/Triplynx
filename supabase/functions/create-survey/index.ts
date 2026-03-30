import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const OPEN_TIME_SLACK_MS = 60_000
const HOURS_DEFAULT_WINDOW = 24

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

type SurveyOptionPayload = {
  label?: string | null
  value?: string | null
  metadata?: Record<string, unknown>
}

type CreateSurveyBody = {
  trip_id?: string
  title?: string
  description?: string | null
  opens_at?: string | null
  closes_at?: string | null
  status?: string | null
  options?: SurveyOptionPayload[]
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

function labelForUser(user: {
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

function formatClosesForMessage(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

async function sendWhatsappSurveyNotice(opts: {
  accountSid: string
  authToken: string
  fromRaw: string
  toE164: string
  tripTitle: string | null
  surveyTitle: string
  closesAtIso: string
  organizerLabel: string
  tripId: string
  appPublicUrl: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = whatsappAddress(
    opts.fromRaw.startsWith("whatsapp:") ? opts.fromRaw : normalizeToE164(opts.fromRaw) ?? opts.fromRaw,
  )
  const to = whatsappAddress(opts.toE164)

  const tripPart = opts.tripTitle?.trim() ? `"${opts.tripTitle.trim()}"` : "your trip"
  const by = opts.organizerLabel.trim() || "Someone"
  const closes = formatClosesForMessage(opts.closesAtIso)
  const base = opts.appPublicUrl?.replace(/\/$/, "") ?? ""
  const linkLine = base
    ? `Open Triplynx to vote: ${base}/dashboard/trips/${opts.tripId}`
    : "Open the Triplynx app to view this trip and respond to the survey."

  const body = [
    `New survey on Triplynx for ${tripPart}: "${opts.surveyTitle.trim()}"`,
    `Shared by ${by}. Please respond by ${closes}.`,
    linkLine,
  ].join("\n\n")

  const url = `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    })
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

    let payload: CreateSurveyBody
    try {
      payload = (await req.json()) as CreateSurveyBody
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const tripId = payload.trip_id?.trim() ?? ""
    if (!tripId || !isUuid(tripId)) {
      return new Response(JSON.stringify({ error: "Valid trip_id (UUID) is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const title = payload.title?.trim()
    if (!title) {
      return new Response(JSON.stringify({ error: "Survey title is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const description = payload.description != null ? String(payload.description).trim() || null : null

    const opensRaw =
      payload.opens_at != null && String(payload.opens_at).trim() !== ""
        ? String(payload.opens_at).trim()
        : null
    const closesRaw =
      payload.closes_at != null && String(payload.closes_at).trim() !== ""
        ? String(payload.closes_at).trim()
        : null

    let opensAtIso: string
    let closesAtIso: string
    const scheduleEvalNowMs = Date.now()

    if (!opensRaw && !closesRaw) {
      const start = new Date()
      const end = new Date(start.getTime() + HOURS_DEFAULT_WINDOW * 60 * 60 * 1000)
      opensAtIso = start.toISOString()
      closesAtIso = end.toISOString()
    } else if (!opensRaw || !closesRaw) {
      return new Response(
        JSON.stringify({
          error:
            "Set both opens_at and closes_at, or omit both for a default window from now through 24 hours from now.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      )
    } else {
      const openMs = new Date(opensRaw).getTime()
      const closeMs = new Date(closesRaw).getTime()
      if (Number.isNaN(openMs) || Number.isNaN(closeMs)) {
        return new Response(JSON.stringify({ error: "Invalid opens_at or closes_at." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        })
      }
      if (openMs < scheduleEvalNowMs - OPEN_TIME_SLACK_MS) {
        return new Response(JSON.stringify({ error: "opens_at must be now or in the future." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        })
      }
      if (closeMs <= openMs) {
        return new Response(JSON.stringify({ error: "closes_at must be strictly after opens_at." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        })
      }
      opensAtIso = new Date(opensRaw).toISOString()
      closesAtIso = new Date(closesRaw).toISOString()
    }

    const openMsForStatus = new Date(opensAtIso).getTime()
    const statusNowMs = Date.now()
    const status =
      !Number.isNaN(openMsForStatus) && openMsForStatus <= statusNowMs + OPEN_TIME_SLACK_MS
        ? "ongoing"
        : "scheduled"

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
      return new Response(JSON.stringify({ error: "You can only add surveys to your own trips." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      })
    }

    const rawOptions = Array.isArray(payload.options) ? payload.options : []
    const normalizedOptions = rawOptions
      .map((o) => {
        const label = o.label != null ? String(o.label).trim() : ""
        const value = o.value != null ? String(o.value).trim() : ""
        const text = label || value
        if (!text) return null
        const meta = o.metadata
        const metadata =
          meta && typeof meta === "object" && !Array.isArray(meta) ? meta as Record<string, unknown> : {}
        return {
          label: label || value || null,
          value: value || label || null,
          metadata,
        }
      })
      .filter((o): o is NonNullable<typeof o> => o !== null)

    const surveyId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { data: surveyRow, error: insertSurveyError } = await supabaseAdmin
      .from("surveys")
      .insert({
        id: surveyId,
        created_at: now,
        trip_id: tripId,
        created_by: user.id,
        title,
        description,
        opens_at: opensAtIso,
        closes_at: closesAtIso,
        status,
        updated_at: now,
      })
      .select(
        "id, created_at, trip_id, created_by, title, description, opens_at, closes_at, updated_at, status",
      )
      .single()

    if (insertSurveyError) {
      throw new Error(insertSurveyError.message)
    }

    let optionsRows: Array<Record<string, unknown>> = []

    if (normalizedOptions.length > 0) {
      const optionInserts = normalizedOptions.map((o) => ({
        id: crypto.randomUUID(),
        created_at: now,
        survey_id: surveyId,
        label: o.label,
        value: o.value,
        metadata: o.metadata,
        updated_at: now,
      }))

      const { data: insertedOptions, error: optionsError } = await supabaseAdmin
        .from("survey_options")
        .insert(optionInserts)
        .select("id, created_at, survey_id, label, value, metadata, updated_at")

      if (optionsError) {
        await supabaseAdmin.from("surveys").delete().eq("id", surveyId)
        throw new Error(optionsError.message)
      }

      optionsRows = insertedOptions ?? []
    }

    type WhatsappMemberResult = { phone: string; sent: boolean; error?: string }
    const whatsappToMembers: WhatsappMemberResult[] = []

    const { data: memberRows, error: membersError } = await supabaseAdmin
      .from("trip_members")
      .select("phone")
      .eq("trip_id", tripId)

    if (!membersError && memberRows?.length) {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim()
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim()
      const fromRaw = Deno.env.get("TWILIO_WHATSAPP_FROM")?.trim()
      const appPublicUrl = Deno.env.get("APP_PUBLIC_URL")?.trim() || null
      const organizerLabel = labelForUser(user)

      const seenE164 = new Set<string>()
      for (const row of memberRows) {
        const rawPhone = row.phone != null ? String(row.phone) : ""
        if (!rawPhone.trim()) continue
        const toE164 = normalizeToE164(rawPhone)
        if (!toE164 || seenE164.has(toE164)) continue
        seenE164.add(toE164)

        if (!accountSid || !authToken || !fromRaw) {
          whatsappToMembers.push({
            phone: toE164,
            sent: false,
            error: "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM.",
          })
          continue
        }

        const result = await sendWhatsappSurveyNotice({
          accountSid,
          authToken,
          fromRaw,
          toE164,
          tripTitle: trip?.title ?? null,
          surveyTitle: title,
          closesAtIso: closesAtIso,
          organizerLabel,
          tripId,
          appPublicUrl,
        })

        whatsappToMembers.push(
          result.ok ? { phone: toE164, sent: true } : { phone: toE164, sent: false, error: result.error },
        )
      }
    }

    const whatsapp_summary = {
      members_with_phone: whatsappToMembers.length,
      sent: whatsappToMembers.filter((r) => r.sent).length,
      failed: whatsappToMembers.filter((r) => !r.sent),
    }

    return new Response(
      JSON.stringify({
        message: "Survey created.",
        survey: { ...surveyRow, options: optionsRows },
        whatsapp_notifications: whatsapp_summary,
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
