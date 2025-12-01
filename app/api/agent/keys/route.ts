import { NextRequest, NextResponse } from 'next/server'
import { createApiKey, getApiKeysForWallet, revokeApiKey } from '@/lib/apiKeys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Fetch all API keys for a wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'wallet_address query parameter required' },
        { status: 400 }
      )
    }

    const result = await getApiKeysForWallet(walletAddress)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      keys: result.keys,
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, name } = body

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address required' },
        { status: 400 }
      )
    }

    const result = await createApiKey(wallet_address, name)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      api_key: result.apiKey,
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, wallet_address } = body

    if (!api_key || !wallet_address) {
      return NextResponse.json(
        { error: 'api_key and wallet_address required' },
        { status: 400 }
      )
    }

    const result = await revokeApiKey(api_key, wallet_address)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}