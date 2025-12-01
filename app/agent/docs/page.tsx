'use client'

export default function AgentDocs() {
  return (
    <main className="min-h-screen w-full bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border border-gray-600 p-6 mb-6 bg-black">
          <h1 className="font-mono text-2xl text-gray-300 mb-2">AGENT API DOCUMENTATION</h1>
          <p className="font-mono text-sm text-gray-500">Integration guide for AI agents</p>
        </div>

        <div className="space-y-6">
          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">OVERVIEW</h2>
            <p className="font-mono text-sm text-gray-400 leading-relaxed">
              The x402 Banana API allows AI agents to autonomously generate images using MNEE stablecoin payments on Ethereum. Agents pay 0.15 MNEE per generation and receive high-quality images powered by Google Gemini.
            </p>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">AUTHENTICATION</h2>
            <div className="space-y-3">
              <p className="font-mono text-sm text-gray-400">1. Connect your wallet to the dashboard</p>
              <p className="font-mono text-sm text-gray-400">2. Generate an API key</p>
              <p className="font-mono text-sm text-gray-400">3. Include API key in Authorization header</p>
              <div className="bg-gray-900 p-4 mt-3">
                <code className="font-mono text-xs text-gray-300">
                  Authorization: Bearer mnee_agent_YOUR_KEY_HERE
                </code>
              </div>
            </div>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">PAYMENT FLOW</h2>
            <div className="space-y-3">
              <p className="font-mono text-sm text-gray-400">1. Transfer 0.15 MNEE to treasury address</p>
              <p className="font-mono text-sm text-gray-400">2. Get transaction hash</p>
              <p className="font-mono text-sm text-gray-400">3. Call API with tx hash as proof</p>
              <p className="font-mono text-sm text-gray-400">4. Receive generated image</p>
            </div>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">API ENDPOINT</h2>
            <div className="space-y-4">
              <div>
                <div className="font-mono text-sm text-gray-400 mb-2">Endpoint:</div>
                <div className="bg-gray-900 p-3">
                  <code className="font-mono text-xs text-gray-300">
                    POST /api/agent/generate
                  </code>
                </div>
              </div>
              
              <div>
                <div className="font-mono text-sm text-gray-400 mb-2">Request Body:</div>
                <pre className="bg-gray-900 p-4 overflow-x-auto">
                  <code className="font-mono text-xs text-gray-300">{`{
  "prompt": "A banana on a skateboard",
  "payment_tx_hash": "0x123...",
  "wallet_address": "0xYourWallet..."
}`}</code>
                </pre>
              </div>

              <div>
                <div className="font-mono text-sm text-gray-400 mb-2">Response:</div>
                <pre className="bg-gray-900 p-4 overflow-x-auto">
                  <code className="font-mono text-xs text-gray-300">{`{
  "success": true,
  "image": {
    "data": "base64_encoded_image",
    "mimeType": "image/png"
  },
  "thinking": ["step1", "step2"],
  "transaction": {
    "hash": "0x123...",
    "amount": "0.15"
  }
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">EXAMPLE CODE</h2>
            <pre className="bg-gray-900 p-4 overflow-x-auto">
              <code className="font-mono text-xs text-gray-300">{`// Using ethers.js or viem
const mneeContract = new Contract(MNEE_ADDRESS, ABI, signer)

// 1. Pay 0.15 MNEE
const tx = await mneeContract.transfer(
  TREASURY_ADDRESS,
  parseUnits("0.15", 6)
)
await tx.wait()

// 2. Call API
const response = await fetch('/api/agent/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mnee_agent_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "A banana on a skateboard",
    payment_tx_hash: tx.hash,
    wallet_address: await signer.getAddress()
  })
})

const result = await response.json()
console.log('Image:', result.image.data)`}</code>
            </pre>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">CONTRACT ADDRESSES</h2>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-sm text-gray-400">MNEE Token:</div>
                <code className="font-mono text-xs text-gray-300">0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF</code>
              </div>
              <div>
                <div className="font-mono text-sm text-gray-400">Network:</div>
                <code className="font-mono text-xs text-gray-300">Ethereum Sepolia Testnet</code>
              </div>
              <div>
                <div className="font-mono text-sm text-gray-400">Treasury:</div>
                <code className="font-mono text-xs text-gray-300">Set via NEXT_PUBLIC_TREASURY_ADDRESS</code>
              </div>
            </div>
          </section>

          <section className="border border-gray-600 p-6 bg-black">
            <h2 className="font-mono text-xl text-gray-300 mb-4">ERROR CODES</h2>
            <div className="space-y-2">
              <div className="font-mono text-xs text-gray-400">401 - Invalid API key</div>
              <div className="font-mono text-xs text-gray-400">400 - Payment already used</div>
              <div className="font-mono text-xs text-gray-400">400 - Payment verification failed</div>
              <div className="font-mono text-xs text-gray-400">403 - Wallet mismatch</div>
              <div className="font-mono text-xs text-gray-400">500 - Internal server error</div>
            </div>
          </section>

          <div className="border border-gray-600 p-6 bg-black text-center">
            <a href="/agent/dashboard" className="font-mono text-blue-400 hover:text-blue-300">
              ← BACK TO DASHBOARD
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}