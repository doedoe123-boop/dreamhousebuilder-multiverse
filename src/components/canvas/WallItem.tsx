import { memo, useRef } from 'react'
import { Group, Line } from 'react-konva'
import type Konva from 'konva'
import { applyHoverFeedback, setCanvasCursor } from '../../utils/editor'
import type { Wall } from '../../types/world'

type WallItemProps = {
  wall: Wall
  isSelected: boolean
  canInteract: boolean
  onSelect: (wallId: string) => void
  onDragEnd: (offset: { x: number; y: number }) => void
}

function WallItemComponent({
  wall,
  isSelected,
  canInteract,
  onSelect,
  onDragEnd,
}: WallItemProps) {
  const groupRef = useRef<Konva.Group>(null)
  const deltaX = wall.x2 - wall.x1
  const deltaY = wall.y2 - wall.y1

  return (
    <Group
      ref={groupRef}
      x={wall.x1}
      y={wall.y1}
      draggable={canInteract}
      onClick={() => {
        if (canInteract) {
          onSelect(wall.id)
        }
      }}
      onTap={() => {
        if (canInteract) {
          onSelect(wall.id)
        }
      }}
      onMouseEnter={() => {
        if (!canInteract) {
          return
        }

        setCanvasCursor('grab')
        applyHoverFeedback(groupRef.current, true)
      }}
      onMouseLeave={() => {
        if (!canInteract) {
          return
        }

        setCanvasCursor('default')
        applyHoverFeedback(groupRef.current, false)
      }}
      onDragStart={() => {
        setCanvasCursor('grabbing')
        applyHoverFeedback(groupRef.current, false)
      }}
      onDragEnd={(event) => {
        event.target.position({ x: 0, y: 0 })
        setCanvasCursor('grab')
        onDragEnd({
          x: event.target.x(),
          y: event.target.y(),
        })
      }}
    >
      <Line
        points={[0, 0, deltaX, deltaY]}
        stroke={isSelected ? '#d97706' : '#6b4f3a'}
        strokeWidth={wall.thickness}
        lineCap="round"
        perfectDrawEnabled={false}
        shadowColor={isSelected ? '#f59e0b' : undefined}
        shadowBlur={isSelected ? 16 : 0}
        shadowOpacity={isSelected ? 0.26 : 0}
      />
    </Group>
  )
}

function areWallPropsEqual(previous: WallItemProps, next: WallItemProps) {
  return (
    previous.isSelected === next.isSelected &&
    previous.canInteract === next.canInteract &&
    previous.wall.id === next.wall.id &&
    previous.wall.x1 === next.wall.x1 &&
    previous.wall.y1 === next.wall.y1 &&
    previous.wall.x2 === next.wall.x2 &&
    previous.wall.y2 === next.wall.y2 &&
    previous.wall.thickness === next.wall.thickness
  )
}

export const WallItem = memo(WallItemComponent, areWallPropsEqual)
