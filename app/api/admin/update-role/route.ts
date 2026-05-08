import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Roles that can be assigned via this API. 'super_admin' is intentionally
// excluded — promoting to super_admin must be done directly in the database.
const ALLOWED_ROLES = ['user', 'admin_logistik', 'admin_marketing', 'admin_data', 'admin_keuangan']

export async function POST(request: NextRequest) {
  try {
    const { userId, newRole } = await request.json()

    // Validate inputs
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing required fields: userId and newRole' }, { status: 400 })
    }
    if (!ALLOWED_ROLES.includes(newRole)) {
      return NextResponse.json({ error: `Role tidak valid: ${newRole}` }, { status: 400 })
    }

    // Verify caller via the Authorization header (Bearer token from Supabase session)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server tidak dikonfigurasi dengan benar (SUPABASE_SERVICE_ROLE_KEY tidak tersedia).' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Verify token and identify the caller
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the caller is a super_admin
    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerError || callerProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Hanya super_admin yang dapat mengubah role pengguna' }, { status: 403 })
    }

    // Perform the role update bypassing RLS via service role
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[update-role] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
