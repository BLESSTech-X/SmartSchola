import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const siteUrl = Deno.env.get("SMARTSCHOLA_SITE_URL")
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !siteUrl) {
    return json({ error: "The secure account invitation service is not fully configured." }, 500)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401)

  try {
    const payload = await req.json()
    const schoolId = String(payload.school_id || "")
    const email = String(payload.email || "").trim().toLowerCase()
    const fullName = String(payload.full_name || "").trim()
    const role = String(payload.role || "")

    if (!schoolId || !email || !fullName || !["student", "parent"].includes(role)) {
      return json({ error: "Provide a school, full name, valid email, and student or parent role." }, 400)
    }
    if (fullName.length > 160 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Check the name and email address and try again." }, 400)
    }

    const token = authHeader.slice("Bearer ".length)
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: authData, error: authError } = await caller.auth.getUser(token)
    if (authError || !authData.user) return json({ error: "Your session is invalid or has expired." }, 401)

    const { data: membership, error: membershipError } = await caller
      .from("school_memberships")
      .select("role,status")
      .eq("school_id", schoolId)
      .eq("user_id", authData.user.id)
      .maybeSingle()

    if (membershipError) return json({ error: "Could not verify your school permissions." }, 403)
    if (!membership || membership.status !== "active" || !["headmaster", "admin"].includes(membership.role)) {
      return json({ error: "Only an active headmaster or administrator can invite portal accounts." }, 403)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: school, error: schoolError } = await admin.from("schools")
      .select("id,name,status").eq("id", schoolId).maybeSingle()
    if (schoolError || !school || school.status !== "verified") {
      return json({ error: "This school is not currently verified for account invitations." }, 400)
    }

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${siteUrl.replace(/\/$/, "")}/SmartSchola/reset-password`,
    })
    if (inviteError || !invited.user) {
      return json({ error: inviteError?.message || "The invitation could not be created." }, 400)
    }

    const { error: insertError } = await admin.from("school_memberships").insert({
      school_id: schoolId,
      user_id: invited.user.id,
      role,
      status: "active",
      login_identifier: email,
      granted_by: authData.user.id,
    })

    if (insertError) {
      await admin.auth.admin.deleteUser(invited.user.id)
      return json({ error: insertError.code === "23505"
        ? "This email already has a membership at this school."
        : "The account was invited but the school membership could not be created. Please retry or contact support." }, 409)
    }

    return json({ success: true, role, email, school_name: school.name,
      message: `Invitation sent to ${email}. They must accept the email invitation and set their password before signing in.` })
  } catch (_error) {
    return json({ error: "The invitation could not be processed. Please try again." }, 500)
  }
})
