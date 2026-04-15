import { useEffect, useMemo, useRef } from 'react'
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import {
  DEFAULT_PILLAR_SIZE,
  DEFAULT_WALL_THICKNESS,
  GRID_SIZE,
} from '../../constants/editor'
import { FURNITURE_STYLES } from '../../constants/furniture'
import type {
  CanvasSize,
  FurnitureType,
  SelectedObject,
  ToolMode,
  ViewportTransform,
  World,
} from '../../types/world'
import {
  getFurniturePlacementPosition,
  setCanvasCursor,
  snap,
} from '../../utils/editor'
import { FurnitureItem } from './FurnitureItem'
import { PillarItem } from './PillarItem'
import { WallItem } from './WallItem'

type EditorCanvasProps = {
  canvasSize: CanvasSize
  world: World
  currentTool: ToolMode
  currentFurnitureType: FurnitureType
  selectedObject: SelectedObject
  viewport: ViewportTransform
  onClearSelection: () => void
  onPlaceFurniture: (type: FurnitureType, x: number, y: number) => void
  onPlacePillar: (x: number, y: number) => void
  onCreateWall: (start: { x: number; y: number }, end: { x: number; y: number }) => void
  onSelectWall: (wallId: string) => void
  onSelectPillar: (pillarId: string) => void
  onSelectFurniture: (furnitureId: string) => void
  onWallDragEnd: (wallId: string, offset: { x: number; y: number }) => void
  onPillarDragEnd: (pillarId: string, position: { x: number; y: number }) => void
  onFurnitureDragEnd: (
    furnitureId: string,
    position: { x: number; y: number },
  ) => void
}

function constrainWallEnd(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return {
      x: end.x,
      y: start.y,
    }
  }

  return {
    x: start.x,
    y: end.y,
  }
}

export function EditorCanvas({
  canvasSize,
  world,
  currentTool,
  currentFurnitureType,
  selectedObject,
  viewport,
  onClearSelection,
  onPlaceFurniture,
  onPlacePillar,
  onCreateWall,
  onSelectWall,
  onSelectPillar,
  onSelectFurniture,
  onWallDragEnd,
  onPillarDragEnd,
  onFurnitureDragEnd,
}: EditorCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const previewLayerRef = useRef<Konva.Layer>(null)
  const ghostGroupRef = useRef<Konva.Group>(null)
  const ghostCellRef = useRef<Konva.Rect>(null)
  const ghostPillarRef = useRef<Konva.Rect>(null)
  const wallDraftRef = useRef<Konva.Line>(null)
  const wallStartRef = useRef<{ x: number; y: number } | null>(null)

  const getPointerInWorld = () => {
    const stage = stageRef.current

    if (!stage) {
      return null
    }

    const pointerPosition = stage.getPointerPosition()

    if (!pointerPosition) {
      return null
    }

    return {
      x: (pointerPosition.x - viewport.x) / viewport.scale,
      y: (pointerPosition.y - viewport.y) / viewport.scale,
    }
  }

  const gridLines = useMemo(() => {
    const lines: Array<{ key: string; points: number[] }> = []

    for (let x = 0; x <= canvasSize.width; x += GRID_SIZE) {
      lines.push({
        key: `vertical-${x}`,
        points: [x, 0, x, canvasSize.height],
      })
    }

    for (let y = 0; y <= canvasSize.height; y += GRID_SIZE) {
      lines.push({
        key: `horizontal-${y}`,
        points: [0, y, canvasSize.width, y],
      })
    }

    return lines
  }, [canvasSize.height, canvasSize.width])

  useEffect(() => {
    ghostGroupRef.current?.visible(false)
    ghostCellRef.current?.visible(false)
    ghostPillarRef.current?.visible(false)
    wallDraftRef.current?.visible(false)
    previewLayerRef.current?.batchDraw()

    if (currentTool === 'select') {
      setCanvasCursor('default')
    }
  }, [currentTool, currentFurnitureType])

  const updatePreview = () => {
    const pointerPosition = getPointerInWorld()

    if (!pointerPosition) {
      ghostGroupRef.current?.visible(false)
      ghostCellRef.current?.visible(false)
      ghostPillarRef.current?.visible(false)
      previewLayerRef.current?.batchDraw()
      return
    }

    const snappedX = snap(pointerPosition.x)
    const snappedY = snap(pointerPosition.y)

    if (currentTool === 'furniture') {
      const placement = getFurniturePlacementPosition(
        currentFurnitureType,
        pointerPosition.x,
        pointerPosition.y,
      )

      setCanvasCursor('crosshair')
      ghostGroupRef.current?.position(placement)
      ghostGroupRef.current?.visible(true)
      ghostPillarRef.current?.visible(false)
      ghostCellRef.current?.position({
        x: snappedX - GRID_SIZE / 2,
        y: snappedY - GRID_SIZE / 2,
      })
      ghostCellRef.current?.visible(true)
    } else if (currentTool === 'pillar') {
      setCanvasCursor('crosshair')
      ghostGroupRef.current?.visible(false)
      ghostCellRef.current?.position({
        x: snappedX - GRID_SIZE / 2,
        y: snappedY - GRID_SIZE / 2,
      })
      ghostCellRef.current?.visible(true)
      ghostPillarRef.current?.position({
        x: snappedX - DEFAULT_PILLAR_SIZE / 2,
        y: snappedY - DEFAULT_PILLAR_SIZE / 2,
      })
      ghostPillarRef.current?.visible(true)
    } else if (currentTool === 'wall' && wallStartRef.current) {
      setCanvasCursor('crosshair')
      const constrainedEnd = constrainWallEnd(wallStartRef.current, {
        x: snappedX,
        y: snappedY,
      })

      wallDraftRef.current?.points([
        wallStartRef.current.x,
        wallStartRef.current.y,
        constrainedEnd.x,
        constrainedEnd.y,
      ])
      wallDraftRef.current?.visible(true)
      ghostGroupRef.current?.visible(false)
      ghostCellRef.current?.visible(false)
      ghostPillarRef.current?.visible(false)
    } else {
      ghostGroupRef.current?.visible(false)
      ghostCellRef.current?.visible(false)
      ghostPillarRef.current?.visible(false)
    }

    previewLayerRef.current?.batchDraw()
  }

  const handlePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const target = event.target
    const clickedBackground =
      target === target.getStage() || target.name() === 'canvas-background'

    if (!clickedBackground) {
      return
    }

    const pointerPosition = getPointerInWorld()

    if (!pointerPosition) {
      return
    }

    const snappedX = snap(pointerPosition.x)
    const snappedY = snap(pointerPosition.y)

    if (currentTool === 'wall') {
      wallStartRef.current = {
        x: snappedX,
        y: snappedY,
      }
      wallDraftRef.current?.points([snappedX, snappedY, snappedX, snappedY])
      wallDraftRef.current?.visible(true)
      previewLayerRef.current?.batchDraw()
      return
    }

    if (currentTool === 'pillar') {
      onPlacePillar(
        snappedX - DEFAULT_PILLAR_SIZE / 2,
        snappedY - DEFAULT_PILLAR_SIZE / 2,
      )
      return
    }

    if (currentTool === 'furniture') {
      onPlaceFurniture(currentFurnitureType, pointerPosition.x, pointerPosition.y)
      return
    }

    onClearSelection()
  }

  const handlePointerUp = () => {
    if (currentTool !== 'wall' || !wallStartRef.current || !wallDraftRef.current) {
      return
    }

    const [, , endX, endY] = wallDraftRef.current.points()

    if (
      wallStartRef.current.x !== endX ||
      wallStartRef.current.y !== endY
    ) {
      onCreateWall(wallStartRef.current, {
        x: endX,
        y: endY,
      })
    }

    wallStartRef.current = null
    wallDraftRef.current.visible(false)
    previewLayerRef.current?.batchDraw()
  }

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      onMouseMove={updatePreview}
      onTouchMove={updatePreview}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
      onMouseLeave={() => {
        ghostGroupRef.current?.visible(false)
        ghostCellRef.current?.visible(false)
        ghostPillarRef.current?.visible(false)
        wallDraftRef.current?.visible(false)
        previewLayerRef.current?.batchDraw()
        wallStartRef.current = null
        setCanvasCursor(currentTool === 'select' ? 'default' : 'crosshair')
      }}
    >
      <Layer>
        <Rect
          name="canvas-background"
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill="#f7f4ee"
          listening={false}
        />
        <Rect
          x={world.foundation.x}
          y={world.foundation.y}
          width={world.foundation.width}
          height={world.foundation.height}
          fill="rgba(222, 214, 197, 0.42)"
          stroke="#d2c5b1"
          strokeWidth={2}
          cornerRadius={16}
          listening={false}
        />
        {gridLines.map((line) => (
          <Line
            key={line.key}
            points={line.points}
            stroke="#e2dbcf"
            strokeWidth={1}
            listening={false}
          />
        ))}
      </Layer>

      <Layer ref={previewLayerRef} listening={false}>
        <Rect
          ref={ghostCellRef}
          width={GRID_SIZE}
          height={GRID_SIZE}
          fill="rgba(245, 158, 11, 0.12)"
          stroke="rgba(217, 119, 6, 0.35)"
          strokeWidth={1}
          cornerRadius={4}
          visible={false}
          listening={false}
        />
        <Rect
          ref={ghostPillarRef}
          width={DEFAULT_PILLAR_SIZE}
          height={DEFAULT_PILLAR_SIZE}
          fill="rgba(176, 137, 104, 0.34)"
          stroke="#b08968"
          strokeWidth={2}
          cornerRadius={6}
          visible={false}
          listening={false}
        />
        <Line
          ref={wallDraftRef}
          points={[0, 0, 0, 0]}
          stroke="#d97706"
          strokeWidth={DEFAULT_WALL_THICKNESS}
          lineCap="round"
          opacity={0.65}
          visible={false}
          listening={false}
        />
        <Group ref={ghostGroupRef} visible={false} listening={false}>
          <Rect
            width={FURNITURE_STYLES[currentFurnitureType].defaultWidth}
            height={FURNITURE_STYLES[currentFurnitureType].defaultHeight}
            fill={FURNITURE_STYLES[currentFurnitureType].fill}
            opacity={0.28}
            stroke="#d97706"
            strokeWidth={2}
            dash={[10, 6]}
            cornerRadius={14}
            listening={false}
          />
          <Text
            width={FURNITURE_STYLES[currentFurnitureType].defaultWidth}
            height={FURNITURE_STYLES[currentFurnitureType].defaultHeight}
            align="center"
            verticalAlign="middle"
            text={FURNITURE_STYLES[currentFurnitureType].label}
            fontSize={16}
            fontStyle="bold"
            fill="#8a4b11"
            opacity={0.85}
            listening={false}
          />
        </Group>
      </Layer>

      <Layer>
        {world.walls.map((wall) => (
          <WallItem
            key={wall.id}
            wall={wall}
            isSelected={
              selectedObject?.kind === 'wall' && selectedObject.id === wall.id
            }
            canInteract={currentTool === 'select'}
            onSelect={onSelectWall}
            onDragEnd={(offset) => {
              onWallDragEnd(wall.id, offset)
            }}
          />
        ))}

        {world.pillars.map((pillar) => (
          <PillarItem
            key={pillar.id}
            pillar={pillar}
            isSelected={
              selectedObject?.kind === 'pillar' &&
              selectedObject.id === pillar.id
            }
            canInteract={currentTool === 'select'}
            onSelect={onSelectPillar}
            onDragEnd={(position) => {
              onPillarDragEnd(pillar.id, position)
            }}
          />
        ))}

        {world.furniture.map((item) => (
          <FurnitureItem
            key={item.id}
            item={item}
            isSelected={
              selectedObject?.kind === 'furniture' &&
              selectedObject.id === item.id
            }
            canInteract={currentTool === 'select'}
            onSelect={onSelectFurniture}
            onDragEnd={(position) => {
              onFurnitureDragEnd(item.id, position)
            }}
          />
        ))}
      </Layer>
    </Stage>
  )
}
