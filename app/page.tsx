'use client'

import { useState, useEffect } from 'react'
import { ImageInput } from '@/components/ImageInput'
import { ResponseDialog } from '@/components/ResponseDialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabaseClient'
import { saveImage, getAllImages, deleteOldImages, deleteImage, type GeneratedImage } from '@/lib/indexedDB'
import { ConnectButton, useActiveAccount, useFetchWithPayment } from 'thirdweb/react'
import { client } from '@/lib/thirdwebClient'
import { sepolia } from 'thirdweb/chains'

interface PromptPreset {
  id: string
  name: string
  prompt: string
  preview_image_url: string | null
  disabled: boolean
}

export default function Home() {
  const account = useActiveAccount()
  const { fetchWithPayment, isPending } = useFetchWithPayment(client)
  const [prompt, setPrompt] = useState('')
  const [image1, setImage1] = useState<string | null>(null)
  const [image2, setImage2] = useState<string | null>(null)
  const [image1MimeType, setImage1MimeType] = useState<string | undefined>(undefined)
  const [image2MimeType, setImage2MimeType] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{ id?: string; image: string; thinking: string[] } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [image1Key, setImage1Key] = useState(0)
  const [image1Initial, setImage1Initial] = useState<{ base64: string; mimeType: string } | null>(null)
  const [image2Key, setImage2Key] = useState(0)
  const [image2Initial, setImage2Initial] = useState<{ base64: string; mimeType: string } | null>(null)
  const [historySelectionMode, setHistorySelectionMode] = useState<1 | 2 | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [presets, setPresets] = useState<PromptPreset[]>([])

  // Load history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const images = await getAllImages()
        setHistory(images)
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
    loadHistory()
  }, [])

  // Load presets from Supabase on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_presets')
          .select('*')
          .eq('disabled', false)
          .order('created_at', { ascending: true })
        
        if (error) throw error
        if (data) setPresets(data)
      } catch (e) {
        console.error('Failed to load presets:', e)
      }
    }
    loadPresets()
  }, [])

  // Save to IndexedDB whenever a new image is generated
  const saveToHistory = async (image: string, thinking: string[], prompt: string) => {
    const newItem: GeneratedImage = {
      id: Date.now().toString(),
      image,
      thinking,
      timestamp: Date.now(),
      prompt
    }
    try {
      await saveImage(newItem)
      await deleteOldImages(20) // Keep only last 20
      const updated = await getAllImages()
      setHistory(updated)
    } catch (e) {
      console.error('Failed to save to history:', e)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('PROMPT REQUIRED')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setIsPulsing(false)

    // Progress animation: 0 to 100 over 40 seconds
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / 40000) * 100, 100)
      setProgress(newProgress)
      
      if (newProgress >= 100) {
        setIsPulsing(true)
      }
    }, 50)

    try {
      // Thirdweb handles wallet connection, funding, and payment automatically
      const data = await fetchWithPayment('https://x402pay.to/api/dgelei', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          image1,
          image2,
          image1MimeType,
          image2MimeType
        })
      }) as any

      if (data.error) {
        setError(data.error)
        clearInterval(progressInterval)
        return
      }

      // Extract data from response structure
      const candidate = data.candidates?.[0]
      if (!candidate?.content?.parts) {
        setError('INVALID RESPONSE FORMAT')
        clearInterval(progressInterval)
        return
      }

      const parts = candidate.content.parts
      const thinkingParts = parts.filter((p: any) => p.thought && p.text).map((p: any) => p.text)
      const imagePart = parts.find((p: any) => p.inlineData)

      if (!imagePart?.inlineData?.data) {
        setError('NO IMAGE GENERATED')
        clearInterval(progressInterval)
        return
      }

      const imageData = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      
      setResponse({
        image: imageData,
        thinking: thinkingParts
      })
      saveToHistory(imageData, thinkingParts, prompt)
      setDialogOpen(true)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'UNKNOWN ERROR')
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setProgress(0)
      setIsPulsing(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="border border-gray-600 p-6 mb-6 bg-black relative overflow-hidden">
          <div 
            className="absolute -right-8 top-0 bottom-0 w-64 bg-no-repeat bg-contain bg-right opacity-100"
            style={{
              backgroundImage: 'url(https://assets-gen.codenut.dev/lib/3700a53f-7c48-4f89-8a5f-ef2a5ac895c3/generated-image-1763954413508.png)'
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="font-mono text-2xl text-gray-300">x402 Banana Playground</h1>
              <p className="font-mono text-xs text-gray-500 mt-1">Powered by Google Gemini 3 Pro Image (Nano Banana Pro)</p>
              <a href="/agent/dashboard" className="font-mono text-xs text-blue-400 hover:text-blue-300 mt-2 block">
                🤖 Agent API Dashboard →
              </a>
            </div>
            <div className="mr-16">
              <ConnectButton
                client={client}
                chain={sepolia}
                theme="dark"
                connectButton={{
                  label: "CONNECT WALLET",
                  className: "font-mono ",
                  style: { borderRadius: 0, fontSize: '12px', color: '#fff', backgroundColor: '#000' }
                }}
                detailsButton={{
                  className: "font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white",
                  style: { borderRadius: 0,  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ImageInput
            key={`input1-${image1Key}`}
            label="Image #1 (Optional)"
            initialImage={image1Initial}
            historyCount={history.length}
            onHistoryModeActivate={() => setHistorySelectionMode(1)}
            onImageChange={(base64, mimeType) => {
              setImage1(base64)
              setImage1MimeType(mimeType)
            }}
          />
          <ImageInput
            key={`input2-${image2Key}`}
            label="Image #2 (Optional)"
            initialImage={image2Initial}
            historyCount={history.length}
            onHistoryModeActivate={() => setHistorySelectionMode(2)}
            onImageChange={(base64, mimeType) => {
              setImage2(base64)
              setImage2MimeType(mimeType)
            }}
          />
        </div>

        <div className="border border-gray-600 p-4 mb-6 bg-black">
          <div className="text-gray-300 font-mono text-sm mb-2">PROMPT</div>
          
          {presets.length > 0 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPrompt(preset.prompt)}
                  className="relative border border-gray-600 bg-black text-gray-300 hover:border-gray-400 hover:text-white transition-colors p-3 text-left overflow-hidden group"
                  style={{ borderRadius: 0 }}
                >
                  {preset.preview_image_url && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                      style={{
                        backgroundImage: `url(${preset.preview_image_url})`,
                        filter: 'brightness(0.4)'
                      }}
                    />
                  )}
                  <div className="relative z-10 font-mono text-xs">{preset.name}</div>
                </button>
              ))}
            </div>
          )}
          
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="font-mono text-sm border-gray-600 bg-black text-gray-300 placeholder:text-gray-600 min-h-[150px]"
            style={{ borderRadius: 0 }}
          />
        </div>

        {error && (
          <div className="border border-red-500 p-4 mb-6 bg-black">
            <div className="text-red-500 font-mono text-sm">ERROR: {error}</div>
          </div>
        )}

        <div className="relative w-full">
          <Button
            onClick={handleGenerate}
            disabled={loading || isPending}
            className="w-full font-mono text-sm border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            variant="outline"
            style={{ borderRadius: 0 }}
          >
            {loading && (
              <div
                className={`absolute left-0 top-0 h-full bg-gray-600 transition-all ${
                  isPulsing ? 'animate-pulse' : ''
                }`}
                style={{
                  width: `${progress}%`,
                  opacity: 0.5,
                  transition: isPulsing ? 'none' : 'width 0.05s linear'
                }}
              />
            )}
            <span className="relative z-10">
              {loading ? 'GENERATING...' : 'GENERATE ($0.15)'}
            </span>
          </Button>
        </div>

        {history.length > 0 && (
          <div className={`mt-8 border p-4 bg-black transition-colors ${
            historySelectionMode ? 'border-white' : 'border-gray-600'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-mono text-lg text-gray-300">GENERATION HISTORY</h2>
              <span className="font-mono text-xs bg-gray-600 text-white px-2 py-1">{history.length}</span>
              {historySelectionMode && (
                <span className="font-mono text-xs text-white ml-auto">
                  SELECT AN ITEM FOR INPUT {historySelectionMode}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-600 bg-black cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => {
                    if (historySelectionMode) {
                      // Load into selected image input
                      const base64Data = item.image.split(',')[1]
                      if (historySelectionMode === 1) {
                        setImage1(base64Data)
                        setImage1MimeType('image/png')
                        setImage1Initial({ base64: base64Data, mimeType: 'image/png' })
                        setImage1Key(prev => prev + 1)
                      } else {
                        setImage2(base64Data)
                        setImage2MimeType('image/png')
                        setImage2Initial({ base64: base64Data, mimeType: 'image/png' })
                        setImage2Key(prev => prev + 1)
                      }
                      setHistorySelectionMode(null)
                    } else {
                      // Open dialog
                      setResponse({ id: item.id, image: item.image, thinking: item.thinking })
                      setDialogOpen(true)
                    }
                  }}
                  title={`${new Date(item.timestamp).toLocaleString()} - ${item.prompt}`}
                >
                  <img src={item.image} alt="Generated" className="w-full aspect-square object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <ResponseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          response={response}
          onEdit={() => {
            if (response?.image) {
              // Extract base64 data from data URI
              const base64Data = response.image.split(',')[1]
              setImage1(base64Data)
              setImage1MimeType('image/png')
              setPrompt('')
              // Set initial image and force re-render
              setImage1Initial({ base64: base64Data, mimeType: 'image/png' })
              setImage1Key(prev => prev + 1)
            }
          }}
          onDelete={async () => {
            if (response?.id) {
              try {
                await deleteImage(response.id)
                const images = await getAllImages()
                setHistory(images)
              } catch (e) {
                console.error('Failed to delete image:', e)
              }
            }
          }}
        />
      </div>
    </main>
  )
}