import { memo, useRef } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { FURNITURE_STYLES } from '../../constants/furniture'
import { applyHoverFeedback, setCanvasCursor } from '../../utils/editor'
import type { Furniture } from '../../types/world'

type FurnitureItemProps = {
  item: Furniture
  isSelected: boolean
  canInteract: boolean
  onSelect: (furnitureId: string) => void
  onDragEnd: (position: { x: number; y: number }) => void
}

function FurnitureItemComponent({
  item,
  isSelected,
  canInteract,
  onSelect,
  onDragEnd,
}: FurnitureItemProps) {
  const groupRef = useRef<Konva.Group>(null)
  const style = FURNITURE_STYLES[item.type]

  return (
    <Group
      ref={groupRef}
      x={item.x}
      y={item.y}
      draggable={canInteract}
      onClick={() => {
        if (canInteract) {
          onSelect(item.id)
        }
      }}
      onTap={() => {
        if (canInteract) {
          onSelect(item.id)
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
        width={item.width}
        height={item.height}
        fill={style.fill}
        stroke={isSelected ? '#d97706' : '#5b4636'}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={14}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        shadowColor={isSelected ? '#f59e0b' : undefined}
        shadowBlur={isSelected ? 16 : 0}
        shadowOpacity={isSelected ? 0.24 : 0}
      />
      <Text
        width={item.width}
        height={item.height}
        align="center"
        verticalAlign="middle"
        text={style.label}
        fontSize={16}
        fontStyle="bold"
        fill="#3e2f26"
        listening={false}
      />
    </Group>
  )
}

function areFurniturePropsEqual(
  previous: FurnitureItemProps,
  next: FurnitureItemProps,
) {
  return (
    previous.isSelected === next.isSelected &&
    previous.canInteract === next.canInteract &&
    previous.item.id === next.item.id &&
    previous.item.type === next.item.type &&
    previous.item.x === next.item.x &&
    previous.item.y === next.item.y &&
    previous.item.width === next.item.width &&
    previous.item.height === next.item.height
  )
}

export const FurnitureItem = memo(FurnitureItemComponent, areFurniturePropsEqual)
