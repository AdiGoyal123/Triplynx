import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type CreateTripRequest = {
  title?: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: string
  created_by?: string | null
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    // Prefer a custom Edge Function secret (dashboard forbids names starting with SUPABASE_).
    // Falls back to the platform-injected key on hosted Supabase.
    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or service role key (SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY).",
      )
    }

    const payload = (await req.json()) as CreateTripRequest
    const title = payload.title?.trim()
    const status = payload.status?.trim() ?? "planning"
    const description = payload.description?.trim() || null
    const startDate = payload.start_date?.trim() || null
    const endDate = payload.end_date?.trim() || null
    const createdBy = payload.created_by?.trim() || null

    if (!title) {
      return new Response(JSON.stringify({ error: "Trip title is required." }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      })
    }

    if (startDate && !isValidDate(startDate)) {
      return new Response(JSON.stringify({ error: "start_date must be YYYY-MM-DD." }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      })
    }

    if (endDate && !isValidDate(endDate)) {
      return new Response(JSON.stringify({ error: "end_date must be YYYY-MM-DD." }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      })
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return new Response(JSON.stringify({ error: "end_date cannot be before start_date." }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    })

    const { data, error } = await supabase
      .from("trips")
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        status,
        created_by: createdBy,
      })
      .select("id, title, status, start_date, end_date, created_at")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify({ trip: data }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    })
  }
})
