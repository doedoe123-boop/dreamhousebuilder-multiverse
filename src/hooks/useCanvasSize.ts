import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { CanvasSize } from '../types/world'

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 900,
  height: 640,
}

export function useCanvasSize(containerRef: RefObject<HTMLDivElement | null>) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(DEFAULT_CANVAS_SIZE)

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    const resizeCanvas = () => {
      setCanvasSize({
        width: Math.max(element.clientWidth, 320),
        height: Math.max(element.clientHeight, 420),
      })
    }

    resizeCanvas()

    const observer = new ResizeObserver(() => {
      resizeCanvas()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [containerRef])

  return canvasSize
}
