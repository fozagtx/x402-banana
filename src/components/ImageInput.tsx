import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ImageInputProps {
  label: string
  onImageChange: (base64: string | null, mimeType?: string) => void
  initialImage?: { base64: string; mimeType: string } | null
  historyCount?: number
  onHistoryModeActivate?: () => void
}

export function ImageInput({ label, onImageChange, initialImage, historyCount = 0, onHistoryModeActivate }: ImageInputProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'upload' | 'url' | 'camera' | 'history'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')

  // Handle initial image from props
  useEffect(() => {
    if (initialImage) {
      const dataUri = `data:${initialImage.mimeType};base64,${initialImage.base64}`
      setImagePreview(dataUri)
      setMimeType(initialImage.mimeType)
      setInputMode('history')
    }
  }, [initialImage])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImagePreview(base64)
        setMimeType(file.type)
        // Extract only base64 data without data URI prefix
        const base64Data = base64.split(',')[1]
        onImageChange(base64Data, file.type)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput) return
    try {
      const response = await fetch(urlInput)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImagePreview(base64)
        setMimeType(blob.type)
        // Extract only base64 data without data URI prefix
        const base64Data = base64.split(',')[1]
        onImageChange(base64Data, blob.type)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Error loading image from URL:', error)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg')
        setImagePreview(base64)
        setMimeType('image/jpeg')
        // Extract only base64 data without data URI prefix
        const base64Data = base64.split(',')[1]
        onImageChange(base64Data, 'image/jpeg')
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const clearImage = () => {
    setImagePreview(null)
    onImageChange(null)
    setUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // If in camera mode, restart camera after clearing
    if (inputMode === 'camera') {
      stopCamera()
      startCamera()
    } else {
      stopCamera()
    }
  }

  return (
    <div className="border border-gray-600 p-4 bg-black">
      <div className="text-gray-300 font-mono text-sm mb-2">{label}</div>
      
      <div className="flex gap-2 mb-3">
        <Button
          onClick={() => {
            stopCamera()
            setInputMode('upload')
          }}
          variant="ghost"
          className={`font-mono text-xs bg-black text-gray-300 hover:bg-gray-600 hover:text-white ${
            inputMode === 'upload' ? 'border border-gray-600' : 'border-0'
          }`}
          style={{ borderRadius: 0 }}
        >
          UPLOAD
        </Button>
        <Button
          onClick={() => {
            setInputMode('camera')
            startCamera()
          }}
          variant="ghost"
          className={`font-mono text-xs bg-black text-gray-300 hover:bg-gray-600 hover:text-white ${
            inputMode === 'camera' ? 'border border-gray-600' : 'border-0'
          }`}
          style={{ borderRadius: 0 }}
        >
          CAMERA
        </Button>
        <Button
          onClick={() => {
            stopCamera()
            setInputMode('url')
          }}
          variant="ghost"
          className={`font-mono text-xs bg-black text-gray-300 hover:bg-gray-600 hover:text-white ${
            inputMode === 'url' ? 'border border-gray-600' : 'border-0'
          }`}
          style={{ borderRadius: 0 }}
        >
          URL
        </Button>
        <Button
          onClick={() => {
            stopCamera()
            setInputMode('history')
            if (!imagePreview && onHistoryModeActivate) {
              onHistoryModeActivate()
            }
          }}
          variant="ghost"
          disabled={historyCount === 0}
          className={`font-mono text-xs bg-black text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed ${
            inputMode === 'history' ? 'border border-gray-600' : 'border-0'
          }`}
          style={{ borderRadius: 0 }}
        >
          HISTORY
        </Button>
      </div>

      {inputMode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
            variant="outline"
            style={{ borderRadius: 0 }}
          >
            SELECT FILE
          </Button>
        </div>
      )}

      {inputMode === 'url' && (
        <div className="flex gap-2">
          <Input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.pexels.com/photos/8875612/pexels-photo-8875612.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            className="font-mono text-xs border-gray-600 bg-black text-gray-300 placeholder:text-gray-600"
            style={{ borderRadius: 0 }}
          />
          <Button
            onClick={handleUrlSubmit}
            className="font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
            variant="outline"
            style={{ borderRadius: 0 }}
          >
            LOAD
          </Button>
        </div>
      )}

      {inputMode === 'history' && !imagePreview && (
        <Button
          onClick={() => onHistoryModeActivate && onHistoryModeActivate()}
          className="w-full font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
          variant="outline"
          style={{ borderRadius: 0 }}
        >
          SELECT AN ITEM IN GENERATION HISTORY
        </Button>
      )}

      {inputMode === 'camera' && !imagePreview && (
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full border border-gray-600 mb-2"
          />
          <Button
            onClick={capturePhoto}
            className="w-full font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
            variant="outline"
            style={{ borderRadius: 0 }}
          >
            CAPTURE
          </Button>
        </div>
      )}

      {imagePreview && (
        <div className="mt-3">
          <img src={imagePreview} alt="Preview" className="w-full border border-gray-600 mb-2" />
          <Button
            onClick={clearImage}
            className="w-full font-mono text-xs border-red-500 bg-black text-red-500 hover:bg-red-500 hover:text-black"
            variant="outline"
            style={{ borderRadius: 0 }}
          >
            CLEAR
          </Button>
        </div>
      )}
    </div>
  )
}
