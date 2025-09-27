import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail, generatePurchaseConfirmationEmail } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid' && session.metadata) {
        const { userId, productName, productVersion } = session.metadata

        // Create purchase record
        const purchase = await prisma.purchase.create({
          data: {
            userId,
            stripePaymentId: session.payment_intent as string,
            stripeCustomerId: session.customer as string,
            productName,
            productVersion,
            amount: session.amount_total!,
            currency: session.currency!,
            status: 'completed',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
          include: {
            user: true,
          },
        })

        // Send confirmation email
        if (purchase.user.email) {
          const emailData = generatePurchaseConfirmationEmail(
            purchase.user.email,
            productName,
            productVersion,
            session.amount_total!,
            session.currency!
          )

          await sendEmail(emailData)
        }

        console.log(`Purchase created for user ${userId}: ${productName}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}