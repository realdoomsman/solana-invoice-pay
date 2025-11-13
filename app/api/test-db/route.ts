import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Test connection
    const { data, error } = await supabase
      .from('escrow_contracts')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection working!',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}
