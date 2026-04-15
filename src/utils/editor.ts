import type Konva from 'konva'
import { FURNITURE_STYLES } from '../constants/furniture'
import { GRID_SIZE } from '../constants/editor'
import type { FurnitureType } from '../types/world'

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export function clampSize(value: number, minimum: number) {
  return Math.max(value, minimum)
}

export function snap(value: number, gridSize = GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize
}

export function getFurniturePlacementPosition(
  type: FurnitureType,
  pointerX: number,
  pointerY: number,
) {
  const catalogItem = FURNITURE_STYLES[type]

  return {
    x: snap(pointerX - catalogItem.defaultWidth / 2),
    y: snap(pointerY - catalogItem.defaultHeight / 2),
  }
}

export function setCanvasCursor(cursor: string) {
  document.body.style.cursor = cursor
}

export function applyHoverFeedback(node: Konva.Group | null, hovered: boolean) {
  if (!node) {
    return
  }

  const scale = hovered ? 1.02 : 1
  node.scale({ x: scale, y: scale })
  node.getLayer()?.batchDraw()
}
