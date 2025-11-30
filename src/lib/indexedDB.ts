const DB_NAME = 'ImageGenerationDB'
const STORE_NAME = 'generatedImages'
const DB_VERSION = 1

export interface GeneratedImage {
  id: string
  image: string
  thinking: string[]
  timestamp: number
  prompt: string
}

let dbInstance: IDBDatabase | null = null

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

export const saveImage = async (image: GeneratedImage): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(image)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getAllImages = async (): Promise<GeneratedImage[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev') // Sort by timestamp descending

    const results: GeneratedImage[] = []
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        results.push(cursor.value)
        if (results.length < 20) { // Limit to 20 most recent
          cursor.continue()
        } else {
          resolve(results)
        }
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export const deleteOldImages = async (keepCount: number = 20): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev')

    let count = 0
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        count++
        if (count > keepCount) {
          cursor.delete()
        }
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export const deleteImage = async (id: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const clearAllImages = async (): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
