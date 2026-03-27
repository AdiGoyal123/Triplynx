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

    return new Response(JSON.stringify({ member: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
