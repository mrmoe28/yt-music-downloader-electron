import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  productName: z.string(),
  productVersion: z.string(),
  price: z.number().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productName, productVersion, price } = checkoutSchema.parse(body)

    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: `${productName} v${productVersion} - Download License`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}?canceled=true`,
      metadata: {
        userId: session.user.id!,
        productName,
        productVersion,
      },
    })

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}