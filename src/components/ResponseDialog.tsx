import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'

interface ResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  response: {
    id?: string
    image: string
    thinking: string[]
  } | null
  onEdit?: () => void
  onDelete?: () => void
}

export function ResponseDialog({ open, onOpenChange, response, onEdit, onDelete }: ResponseDialogProps) {
  const [thinkingOpen, setThinkingOpen] = useState(false)

  const handleDownload = () => {
    if (!response?.image) return
    const link = document.createElement('a')
    link.href = response.image
    link.download = `generated-image-${Date.now()}.png`
    link.click()
  }

  const handleCopy = async () => {
    if (!response?.image) return
    try {
      const blob = await fetch(response.image).then(r => r.blob())
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
    } catch (error) {
      console.error('Failed to copy image:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black border-gray-600 text-gray-300 font-mono flex flex-col" style={{ borderRadius: 0 }} hideClose>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-gray-300">GENERATION RESULT</DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onEdit?.()
                  onOpenChange(false)
                }}
                className="font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
                variant="outline"
                style={{ borderRadius: 0 }}
              >
                EDIT
              </Button>
              <Button
                onClick={handleCopy}
                className="font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
                variant="outline"
                style={{ borderRadius: 0 }}
              >
                COPY
              </Button>
              <Button
                onClick={handleDownload}
                className="font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
                variant="outline"
                style={{ borderRadius: 0 }}
              >
                DOWNLOAD
              </Button>
              {response?.id && onDelete && (
                <Button
                  onClick={() => {
                    onDelete()
                    onOpenChange(false)
                  }}
                  className="font-mono text-xs border-red-600 bg-black text-red-400 hover:bg-red-600 hover:text-white"
                  variant="outline"
                  style={{ borderRadius: 0 }}
                >
                  DELETE
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white"
                variant="outline"
                style={{ borderRadius: 0 }}
              >
                CLOSE
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
          {response?.image && (
            <div className="border border-gray-600 bg-black flex items-center justify-center">
              <img src={response.image} alt="Generated" className="w-full h-auto" />
            </div>
          )}
          
          {response?.thinking && response.thinking.length > 0 && (
            <Collapsible open={thinkingOpen} onOpenChange={setThinkingOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  className="w-full font-mono text-xs border-gray-600 bg-black text-gray-300 hover:bg-gray-600 hover:text-white justify-between"
                  variant="outline"
                  style={{ borderRadius: 0 }}
                >
                  <span>THINKING PROCESS</span>
                  <span>{thinkingOpen ? '▼' : '▶'}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-gray-600 border-t-0 p-4 bg-black max-h-[40vh] overflow-y-auto">
                  <div className="space-y-2">
                    {response.thinking.map((thought, idx) => (
                      <div key={idx} className="text-xs text-gray-400 font-mono">
                        <span className="text-gray-500">[{idx + 1}]</span> {thought}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
