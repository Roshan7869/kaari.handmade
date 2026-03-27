import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface CreateOrderRequest {
  amount: number
  currency: string
  customer_email: string
  customer_phone: string
  customer_name: string
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)) } catch {}
          }
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateOrderRequest = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!body.customer_email || !body.customer_phone) {
      return NextResponse.json({ error: 'Missing customer details' }, { status: 400 })
    }

    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        user_id: session.user.id,
        amount: body.amount,
        currency: body.currency || 'INR',
        status: 'pending',
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name,
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Payment endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
