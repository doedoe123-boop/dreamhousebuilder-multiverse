import { memo, useRef } from 'react'
import { Group, Rect } from 'react-konva'
import type Konva from 'konva'
import { applyHoverFeedback, setCanvasCursor } from '../../utils/editor'
import type { Pillar } from '../../types/world'

type PillarItemProps = {
  pillar: Pillar
  isSelected: boolean
  canInteract: boolean
  onSelect: (pillarId: string) => void
  onDragEnd: (position: { x: number; y: number }) => void
}

function PillarItemComponent({
  pillar,
  isSelected,
  canInteract,
  onSelect,
  onDragEnd,
}: PillarItemProps) {
  const groupRef = useRef<Konva.Group>(null)

  return (
    <Group
      ref={groupRef}
      x={pillar.x}
      y={pillar.y}
      draggable={canInteract}
      onClick={() => {
        if (canInteract) {
          onSelect(pillar.id)
        }
      }}
      onTap={() => {
        if (canInteract) {
          onSelect(pillar.id)
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
        setCanvasCursor('grab')
        onDragEnd({
          x: event.target.x(),
          y: event.target.y(),
        })
      }}
    >
      <Rect
        width={pillar.size}
        height={pillar.size}
        fill="#b08968"
        stroke={isSelected ? '#d97706' : '#5b4636'}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={6}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        shadowColor={isSelected ? '#f59e0b' : undefined}
        shadowBlur={isSelected ? 14 : 0}
        shadowOpacity={isSelected ? 0.24 : 0}
      />
    </Group>
  )
}

function arePillarPropsEqual(previous: PillarItemProps, next: PillarItemProps) {
  return (
    previous.isSelected === next.isSelected &&
    previous.canInteract === next.canInteract &&
    previous.pillar.id === next.pillar.id &&
    previous.pillar.x === next.pillar.x &&
    previous.pillar.y === next.pillar.y &&
    previous.pillar.size === next.pillar.size
  )
}

export const PillarItem = memo(PillarItemComponent, arePillarPropsEqual)
