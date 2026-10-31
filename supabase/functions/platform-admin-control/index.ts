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

  const url = Deno.env.get("SUPABASE_URL")
  const anon = Deno.env.get("SUPABASE_ANON_KEY")
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !anon || !service) return json({ error: "Platform administration is not configured." }, 500)

  const header = req.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401)

  try {
    const token = header.slice(7)
    const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: auth, error: authError } = await caller.auth.getUser(token)
    if (authError || !auth.user) return json({ error: "Your session has expired. Sign in again." }, 401)

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: grant, error: grantError } = await admin.from("platform_admins")
      .select("role,status").eq("user_id", auth.user.id).maybeSingle()
    if (grantError || !grant || grant.status !== "active" || !["owner","admin"].includes(grant.role)) {
      return json({ error: "Only an active platform owner or administrator can perform this action." }, 403)
    }

    const body = await req.json()
    const schoolId = String(body.school_id || "")
    const nextStatus = String(body.status || "")
    if (!/^[0-9a-f-]{36}$/i.test(schoolId) || !["verified","suspended"].includes(nextStatus)) {
      return json({ error: "Choose a valid school and an allowed status." }, 400)
    }

    const { data: school, error: schoolError } = await admin.from("schools")
      .select("id,name,status").eq("id", schoolId).maybeSingle()
    if (schoolError || !school) return json({ error: "School not found." }, 404)
    if (school.status === nextStatus) return json({ success: true, message: "The school already has this status." })

    const { error: updateError } = await admin.from("schools")
      .update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", schoolId)
    if (updateError) return json({ error: "The school status could not be updated." }, 500)

    const { error: auditError } = await admin.from("platform_admin_audit_logs").insert({
      actor_user_id: auth.user.id,
      action: nextStatus === "verified" ? "school.verified" : "school.suspended",
      target_type: "school",
      target_id: schoolId,
      details: { school_name: school.name, previous_status: school.status, new_status: nextStatus },
    })
    if (auditError) {
      // The privileged change succeeded; surface the audit failure explicitly.
      return json({ success: true, warning: "School status changed, but the audit entry failed. Contact platform engineering.", school_name: school.name }, 200)
    }
    return json({ success: true, message: `${school.name} is now ${nextStatus}.` })
  } catch (_error) {
    return json({ error: "The platform action could not be completed." }, 500)
  }
})
