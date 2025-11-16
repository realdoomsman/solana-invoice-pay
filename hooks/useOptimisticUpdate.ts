import { useState, useCallback } from 'react'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  rollbackDelay?: number
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (
      optimisticValue: T,
      asyncUpdate: () => Promise<T>
    ) => {
      // Store original value for rollback
      const originalValue = data

      // Apply optimistic update immediately
      setData(optimisticValue)
      setIsOptimistic(true)
      setError(null)

      try {
        // Perform actual async operation
        const result = await asyncUpdate()
        
        // Update with real data
        setData(result)
        setIsOptimistic(false)
        options.onSuccess?.(result)
        
        return result
      } catch (err) {
        // Rollback on error
        const error = err instanceof Error ? err : new Error('Update failed')
        
        setTimeout(() => {
          setData(originalValue)
          setIsOptimistic(false)
          setError(error)
          options.onError?.(error)
        }, options.rollbackDelay || 0)
        
        throw error
      }
    },
    [data, options]
  )

  const reset = useCallback(() => {
    setIsOptimistic(false)
    setError(null)
  }, [])

  return {
    data,
    isOptimistic,
    error,
    update,
    reset,
    setData
  }
}

// Hook for optimistic list updates (add/remove items)
export function useOptimisticList<T extends { id: string }>(
  initialList: T[]
) {
  const [list, setList] = useState<T[]>(initialList)
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set())

  const addOptimistic = useCallback(
    async (item: T, asyncAdd: () => Promise<T>) => {
      // Add optimistically
      setList(prev => [...prev, item])
      setOptimisticIds(prev => new Set(prev).add(item.id))

      try {
        const result = await asyncAdd()
        
        // Replace optimistic item with real one
        setList(prev => prev.map(i => i.id === item.id ? result : i))
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
        
        return result
      } catch (error) {
        // Remove on error
        setList(prev => prev.filter(i => i.id !== item.id))
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
        throw error
      }
    },
    []
  )

  const removeOptimistic = useCallback(
    async (id: string, asyncRemove: () => Promise<void>) => {
      // Store for rollback
      const item = list.find(i => i.id === id)
      if (!item) return

      // Remove optimistically
      setList(prev => prev.filter(i => i.id !== id))
      setOptimisticIds(prev => new Set(prev).add(id))

      try {
        await asyncRemove()
        
        // Confirm removal
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      } catch (error) {
        // Restore on error
        setList(prev => [...prev, item])
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        throw error
      }
    },
    [list]
  )

  const updateOptimistic = useCallback(
    async (id: string, updates: Partial<T>, asyncUpdate: () => Promise<T>) => {
      // Store original for rollback
      const originalItem = list.find(i => i.id === id)
      if (!originalItem) return

      // Update optimistically
      setList(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
      setOptimisticIds(prev => new Set(prev).add(id))

      try {
        const result = await asyncUpdate()
        
        // Update with real data
        setList(prev => prev.map(i => i.id === id ? result : i))
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        
        return result
      } catch (error) {
        // Rollback on error
        setList(prev => prev.map(i => i.id === id ? originalItem : i))
        setOptimisticIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        throw error
      }
    },
    [list]
  )

  return {
    list,
    optimisticIds,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    setList
  }
}
