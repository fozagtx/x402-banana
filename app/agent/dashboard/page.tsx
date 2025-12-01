'use client'

import { useState, useEffect } from 'react'
import { ConnectButton, useActiveAccount } from 'thirdweb/react'
import { client } from '@/lib/thirdwebClient'
import { sepolia } from 'thirdweb/chains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getMNEEBalance } from '@/lib/mneeClient'
import type { ApiKey } from '@/lib/apiKeys'

export default function AgentDashboard() {
  const account = useActiveAccount()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [mneeBalance, setMneeBalance] = useState<string>('0')
  const [newKeyName, setNewKeyName] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (account?.address) {
      loadApiKeys()
      loadMneeBalance()
    }
  }, [account?.address])

  const loadMneeBalance = async () => {
    if (!account?.address) return
    try {
      const balance = await getMNEEBalance(account.address as `0x${string}`)
      setMneeBalance(balance)
    } catch (error) {
      console.error('Error loading MNEE balance:', error)
    }
  }

  const loadApiKeys = async () => {
    if (!account?.address) return
    setLoading(true)
    try {
      const response = await fetch(`/api/agent/keys?wallet_address=${account.address}`)
      const data = await response.json()
      if (data.success) {
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    if (!account?.address) return
    setLoading(true)
    try {
      const response = await fetch('/api/agent/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: account.address,
          name: newKeyName || 'Unnamed Key',
        }),
      })
      const data = await response.json()
      if (data.success) {
        setNewKeyName('')
        await loadApiKeys()
        if (data.api_key) {
          await navigator.clipboard.writeText(data.api_key)
          setCopiedKey(data.api_key)
          setTimeout(() => setCopiedKey(null), 3000)
        }
      }
    } catch (error) {
      console.error('Error generating API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(text)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const revokeKey = async (apiKey: string) => {
    if (!account?.address || !confirm('Are you sure you want to revoke this API key?')) return
    setLoading(true)
    try {
      const response = await fetch('/api/agent/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, wallet_address: account.address }),
      })
      if (response.ok) {
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="border border-gray-600 p-6 mb-6 bg-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-mono text-2xl text-gray-300">AGENT API DASHBOARD</h1>
              <p className="font-mono text-xs text-gray-500 mt-1">Manage API keys for AI agents</p>
            </div>
            <ConnectButton client={client} chain={sepolia} theme="dark" />
          </div>
        </div>

        {!account?.address ? (
          <div className="border border-gray-600 p-12 bg-black text-center">
            <p className="font-mono text-gray-400 text-lg">CONNECT WALLET TO ACCESS DASHBOARD</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-600 bg-black p-6">
                <div className="font-mono text-sm text-gray-400 mb-2">WALLET</div>
                <div className="font-mono text-gray-300 break-all">{account.address}</div>
              </div>
              <div className="border border-gray-600 bg-black p-6">
                <div className="font-mono text-sm text-gray-400 mb-2">MNEE BALANCE</div>
                <div className="font-mono text-2xl text-gray-300">{mneeBalance} MNEE</div>
              </div>
            </div>

            <div className="border border-gray-600 p-6 mb-6 bg-black">
              <h2 className="font-mono text-lg text-gray-300 mb-4">GENERATE NEW API KEY</h2>
              <div className="flex gap-3">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g., Trading Bot)"
                  className="font-mono text-sm border-gray-600 bg-black text-gray-300"
                  style={{ borderRadius: 0 }}
                />
                <Button onClick={generateApiKey} disabled={loading} variant="outline" style={{ borderRadius: 0 }}>
                  GENERATE
                </Button>
              </div>
            </div>

            <div className="border border-gray-600 p-6 bg-black">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-lg text-gray-300">YOUR API KEYS</h2>
                <span className="font-mono text-xs bg-gray-600 text-white px-2 py-1">{apiKeys.length}</span>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-8 font-mono text-gray-400">No API keys yet. Generate one above.</div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className={`border p-4 ${key.is_active ? 'border-gray-600' : 'border-red-900 opacity-50'} bg-black`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-300 mb-1">{key.name || 'Unnamed'}</div>
                          <div className="font-mono text-xs text-gray-500 break-all">{key.api_key}</div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button onClick={() => copyToClipboard(key.api_key)} variant="outline" style={{ borderRadius: 0 }}>
                            {copiedKey === key.api_key ? 'COPIED' : 'COPY'}
                          </Button>
                          {key.is_active && (
                            <Button onClick={() => revokeKey(key.api_key)} variant="outline" style={{ borderRadius: 0 }}>
                              REVOKE
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700">
                        <div className="font-mono text-xs text-gray-500">Created: {new Date(key.created_at).toLocaleDateString()}</div>
                        <div className="font-mono text-xs text-gray-500">Usage: {key.usage_count}</div>
                        <div className={`font-mono text-xs ml-auto ${key.is_active ? 'text-green-500' : 'text-red-500'}`}>
                          {key.is_active ? 'ACTIVE' : 'REVOKED'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-gray-600 p-6 mt-6 bg-black">
              <h2 className="font-mono text-lg text-gray-300 mb-4">DOCUMENTATION</h2>
              <a href="/agent/docs" className="font-mono text-xs text-blue-400 hover:text-blue-300">View API docs →</a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}