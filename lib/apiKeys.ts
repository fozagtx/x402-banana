import { supabase } from './supabaseClient'
import { randomBytes } from 'crypto'

export interface ApiKey {
  id: string
  api_key: string
  wallet_address: string
  name: string | null
  created_at: string
  usage_count: number
  last_used: string | null
  is_active: boolean
}

/**
 * Generate a new API key with format: mnee_agent_[32_random_chars]
 */
export function generateApiKey(): string {
  const randomString = randomBytes(16).toString('hex')
  return `mnee_agent_${randomString}`
}

/**
 * Create a new API key for a wallet address
 */
export async function createApiKey(
  walletAddress: string,
  name?: string
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  try {
    const apiKey = generateApiKey()
    
    const { data, error } = await supabase
      .from('agent_api_keys')
      .insert({
        api_key: apiKey,
        wallet_address: walletAddress.toLowerCase(),
        name: name || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true, apiKey }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Validate an API key and return associated wallet address
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; walletAddress?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agent_api_keys')
      .select('wallet_address, is_active')
      .eq('api_key', apiKey)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid API key' }
    }

    if (!data.is_active) {
      return { valid: false, error: 'API key is inactive' }
    }

    return { valid: true, walletAddress: data.wallet_address }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get all API keys for a wallet address
 */
export async function getApiKeysForWallet(
  walletAddress: string
): Promise<{ success: boolean; keys?: ApiKey[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agent_api_keys')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keys: data as ApiKey[] }
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeApiKey(
  apiKey: string,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agent_api_keys')
      .update({ is_active: false })
      .eq('api_key', apiKey)
      .eq('wallet_address', walletAddress.toLowerCase())

    if (error) {
      console.error('Error revoking API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error revoking API key:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Increment usage count for an API key
 */
export async function incrementUsage(apiKey: string): Promise<void> {
  try {
    await supabase.rpc('increment_api_key_usage', { key: apiKey })
  } catch (error) {
    console.error('Error incrementing usage:', error)
  }
}

/**
 * Update last used timestamp for an API key
 */
export async function updateLastUsed(apiKey: string): Promise<void> {
  try {
    await supabase
      .from('agent_api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('api_key', apiKey)
  } catch (error) {
    console.error('Error updating last used:', error)
  }
}

/**
 * Log a payment transaction
 */
export async function logPayment(
  apiKeyId: string,
  walletAddress: string,
  txHash: string,
  amountMnee: string,
  prompt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('agent_payments')
      .insert({
        api_key_id: apiKeyId,
        wallet_address: walletAddress.toLowerCase(),
        tx_hash: txHash,
        amount_mnee: amountMnee,
        prompt: prompt,
        image_generated: false,
      })

    if (error) {
      console.error('Error logging payment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error logging payment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Mark payment as having generated an image
 */
export async function markImageGenerated(txHash: string): Promise<void> {
  try {
    await supabase
      .from('agent_payments')
      .update({ image_generated: true })
      .eq('tx_hash', txHash)
  } catch (error) {
    console.error('Error marking image generated:', error)
  }
}

/**
 * Get payment history for an API key
 */
export async function getPaymentHistory(
  apiKeyId: string
): Promise<{ success: boolean; payments?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agent_payments')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching payment history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, payments: data }
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}