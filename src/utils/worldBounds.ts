import type { CanvasSize, ViewportTransform, World, WorldBounds } from '../types/world'

const MIN_WORLD_SIZE = 1
const DEFAULT_PADDING_RATIO = 0.12
const MIN_STAGE_SCALE = 0.18
const MAX_STAGE_SCALE = 1.6

function expandBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
) {
  bounds.minX = Math.min(bounds.minX, minX)
  bounds.minY = Math.min(bounds.minY, minY)
  bounds.maxX = Math.max(bounds.maxX, maxX)
  bounds.maxY = Math.max(bounds.maxY, maxY)
}

export function getWorldBounds(world: World): WorldBounds {
  const bounds = {
    minX: world.foundation.x,
    minY: world.foundation.y,
    maxX: world.foundation.x + world.foundation.width,
    maxY: world.foundation.y + world.foundation.height,
  }

  world.walls.forEach((wall) => {
    const halfThickness = wall.thickness / 2
    expandBounds(
      bounds,
      Math.min(wall.x1, wall.x2) - halfThickness,
      Math.min(wall.y1, wall.y2) - halfThickness,
      Math.max(wall.x1, wall.x2) + halfThickness,
      Math.max(wall.y1, wall.y2) + halfThickness,
    )
  })

  world.pillars.forEach((pillar) => {
    expandBounds(
      bounds,
      pillar.x,
      pillar.y,
      pillar.x + pillar.size,
      pillar.y + pillar.size,
    )
  })

  world.furniture.forEach((item) => {
    expandBounds(
      bounds,
      item.x,
      item.y,
      item.x + item.width,
      item.y + item.height,
    )
  })

  const width = Math.max(bounds.maxX - bounds.minX, MIN_WORLD_SIZE)
  const height = Math.max(bounds.maxY - bounds.minY, MIN_WORLD_SIZE)

  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
    centerX: bounds.minX + width / 2,
    centerY: bounds.minY + height / 2,
    width,
    height,
  }
}

export function frameWorld(
  bounds: WorldBounds,
  canvasSize: CanvasSize,
  paddingRatio = DEFAULT_PADDING_RATIO,
): ViewportTransform {
  const safeWidth = Math.max(canvasSize.width, 1)
  const safeHeight = Math.max(canvasSize.height, 1)
  const usableWidth = safeWidth * (1 - paddingRatio * 2)
  const usableHeight = safeHeight * (1 - paddingRatio * 2)
  const scaleX = usableWidth / Math.max(bounds.width, MIN_WORLD_SIZE)
  const scaleY = usableHeight / Math.max(bounds.height, MIN_WORLD_SIZE)
  const scale = Math.min(
    Math.max(Math.min(scaleX, scaleY), MIN_STAGE_SCALE),
    MAX_STAGE_SCALE,
  )

  return {
    x: safeWidth / 2 - bounds.centerX * scale,
    y: safeHeight / 2 - bounds.centerY * scale,
    scale,
  }
}
