import { createPublicClient, http, parseUnits, formatUnits, Address, Hash } from 'viem'
import { sepolia, mainnet } from 'viem/chains'

// MNEE Token Contract Address (from hackathon)
export const MNEE_CONTRACT_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF' as Address

// Treasury wallet address - UPDATE THIS with your wallet
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address || '0x0000000000000000000000000000000000000000' as Address

// Use Sepolia testnet for development
const CHAIN = sepolia

// ERC20 ABI for MNEE token
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const

// Create public client for reading blockchain
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
})

// MNEE token has 6 decimals (like USDC)
export const MNEE_DECIMALS = 6

// Price for image generation in MNEE (0.15 MNEE)
export const GENERATION_PRICE_MNEE = '0.15'
export const GENERATION_PRICE_UNITS = parseUnits(GENERATION_PRICE_MNEE, MNEE_DECIMALS)

/**
 * Get MNEE balance for an address
 */
export async function getMNEEBalance(address: Address): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: MNEE_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
    return formatUnits(balance as bigint, MNEE_DECIMALS)
  } catch (error) {
    console.error('Error getting MNEE balance:', error)
    return '0'
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(
  txHash: Hash,
  expectedAmount: bigint = GENERATION_PRICE_UNITS,
  maxAgeMinutes: number = 5
): Promise<{ valid: boolean; error?: string; from?: Address }> {
  try {
    // Get transaction details
    const tx = await publicClient.getTransaction({ hash: txHash })
    
    if (!tx) {
      return { valid: false, error: 'Transaction not found' }
    }

    // Verify transaction is to MNEE contract
    if (tx.to?.toLowerCase() !== MNEE_CONTRACT_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Transaction not to MNEE contract' }
    }

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
    
    if (!receipt) {
      return { valid: false, error: 'Transaction receipt not found' }
    }

    // Check transaction succeeded
    if (receipt.status !== 'success') {
      return { valid: false, error: 'Transaction failed' }
    }

    // Get block to check timestamp
    const block = await publicClient.getBlock({ blockHash: receipt.blockHash })
    const txTimestamp = Number(block.timestamp) * 1000 // Convert to milliseconds
    const now = Date.now()
    const ageMinutes = (now - txTimestamp) / (1000 * 60)

    if (ageMinutes > maxAgeMinutes) {
      return { valid: false, error: `Transaction too old (${ageMinutes.toFixed(1)} minutes)` }
    }

    // Decode transfer data from transaction input
    // ERC20 transfer function signature: transfer(address,uint256)
    // The input data should contain the recipient and amount
    const inputData = tx.input
    
    // For a transfer, the input should be:
    // 0xa9059cbb (transfer function selector) + 32 bytes (recipient) + 32 bytes (amount)
    if (inputData.length < 138) { // 10 chars for 0x + selector + 128 chars for params
      return { valid: false, error: 'Invalid transaction data' }
    }

    // Extract recipient address (remove 0xa9059cbb and get next 32 bytes, take last 20 bytes)
    const recipientHex = '0x' + inputData.slice(34, 74) // Skip function selector (10 chars) and get address
    const recipient = recipientHex.toLowerCase()

    // Check if recipient is treasury
    if (recipient !== TREASURY_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Payment not sent to treasury address' }
    }

    // Extract amount (last 32 bytes)
    const amountHex = '0x' + inputData.slice(74, 138)
    const amount = BigInt(amountHex)

    // Verify amount is correct
    if (amount < expectedAmount) {
      return { 
        valid: false, 
        error: `Insufficient payment amount. Expected ${formatUnits(expectedAmount, MNEE_DECIMALS)} MNEE, got ${formatUnits(amount, MNEE_DECIMALS)} MNEE` 
      }
    }

    return { valid: true, from: tx.from }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if an address has sufficient MNEE balance
 */
export async function hasSufficientBalance(
  address: Address,
  requiredAmount: bigint = GENERATION_PRICE_UNITS
): Promise<boolean> {
  try {
    const balance = await publicClient.readContract({
      address: MNEE_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
    return (balance as bigint) >= requiredAmount
  } catch (error) {
    console.error('Error checking balance:', error)
    return false
  }
}

/**
 * Get chain configuration
 */
export function getChain() {
  return CHAIN
}

/**
 * Format MNEE amount for display
 */
export function formatMNEE(amount: bigint): string {
  return formatUnits(amount, MNEE_DECIMALS)
}

/**
 * Parse MNEE amount from string
 */
export function parseMNEE(amount: string): bigint {
  return parseUnits(amount, MNEE_DECIMALS)
}