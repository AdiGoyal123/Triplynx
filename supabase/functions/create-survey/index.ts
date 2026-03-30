import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const SURVEY_STATUSES = new Set(["draft", "ongoing", "closed"])

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
    const opensAt = payload.opens_at?.trim() || null
    const closesAt = payload.closes_at?.trim() || null

    if (opensAt && closesAt) {
      const open = new Date(opensAt).getTime()
      const close = new Date(closesAt).getTime()
      if (!Number.isNaN(open) && !Number.isNaN(close) && close < open) {
        return new Response(JSON.stringify({ error: "closes_at cannot be before opens_at." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        })
      }
    }

    let status: string | null = null
    if (payload.status != null && String(payload.status).trim() !== "") {
      const s = String(payload.status).trim()
      if (!SURVEY_STATUSES.has(s)) {
        return new Response(
          JSON.stringify({ error: "status must be one of: draft, ongoing, closed." }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        )
      }
      status = s
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id, created_by")
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
        opens_at: opensAt,
        closes_at: closesAt,
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

    return new Response(
      JSON.stringify({
        message: "Survey created.",
        survey: { ...surveyRow, options: optionsRows },
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
