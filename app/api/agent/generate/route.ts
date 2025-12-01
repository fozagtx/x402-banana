import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, updateLastUsed } from '@/lib/apiKeys'
import { verifyPayment, GENERATION_PRICE_MNEE } from '@/lib/mneeClient'
import { supabase } from '@/lib/supabaseClient'
import { Hash } from 'viem'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GenerateRequest {
  prompt: string
  payment_tx_hash: string
  wallet_address: string
  image1?: string
  image2?: string
  image1MimeType?: string
  image2MimeType?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API Key
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)
    const validation = await validateApiKey(apiKey)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body: GenerateRequest = await request.json()
    const { prompt, payment_tx_hash, wallet_address, image1, image2, image1MimeType, image2MimeType } = body

    if (!prompt || !payment_tx_hash || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, payment_tx_hash, wallet_address' },
        { status: 400 }
      )
    }

    // 3. Verify wallet address matches API key owner
    if (wallet_address.toLowerCase() !== validation.walletAddress?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wallet address does not match API key owner' },
        { status: 403 }
      )
    }

    // 4. Check if transaction hash has been used before
    const { data: existingPayment } = await supabase
      .from('agent_payments')
      .select('*')
      .eq('tx_hash', payment_tx_hash)
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment transaction already used' },
        { status: 400 }
      )
    }

    // 5. Verify payment on blockchain
    const paymentVerification = await verifyPayment(payment_tx_hash as Hash)
    
    if (!paymentVerification.valid) {
      return NextResponse.json(
        { error: `Payment verification failed: ${paymentVerification.error}` },
        { status: 400 }
      )
    }

    // 6. Verify payment is from the claimed wallet
    if (paymentVerification.from?.toLowerCase() !== wallet_address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Payment not from claimed wallet address' },
        { status: 403 }
      )
    }

    // 7. Log payment in database
    const { data: apiKeyData } = await supabase
      .from('agent_api_keys')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (apiKeyData) {
      await supabase.from('agent_payments').insert({
        api_key_id: apiKeyData.id,
        wallet_address: wallet_address.toLowerCase(),
        tx_hash: payment_tx_hash,
        amount_mnee: GENERATION_PRICE_MNEE,
        prompt: prompt,
      })
    }

    // 8. Update API key usage
    await updateLastUsed(apiKey)

    // 9. Call image generation API
    const imageResponse = await fetch('https://x402pay.to/api/dgelei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image1, image2, image1MimeType, image2MimeType }),
    })

    const imageData = await imageResponse.json()
    const candidate = imageData.candidates?.[0]
    const parts = candidate?.content?.parts || []
    const thinkingParts = parts.filter((p: any) => p.thought && p.text).map((p: any) => p.text)
    const imagePart = parts.find((p: any) => p.inlineData)

    return NextResponse.json({
      success: true,
      image: { data: imagePart?.inlineData?.data, mimeType: imagePart?.inlineData?.mimeType },
      thinking: thinkingParts,
      transaction: { hash: payment_tx_hash, amount: GENERATION_PRICE_MNEE },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}