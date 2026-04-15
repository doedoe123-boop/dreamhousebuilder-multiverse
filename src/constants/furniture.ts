import type { FurnitureType } from '../types/world'

export type FurnitureAppearance = {
  type: FurnitureType
  fill: string
  label: string
  defaultWidth: number
  defaultHeight: number
}

export const FURNITURE_STYLES: Record<FurnitureType, FurnitureAppearance> = {
  bed: {
    type: 'bed',
    defaultWidth: 92,
    defaultHeight: 54,
    fill: '#9d6b53',
    label: 'Bed',
  },
  sofa: {
    type: 'sofa',
    defaultWidth: 96,
    defaultHeight: 46,
    fill: '#6f9acb',
    label: 'Sofa',
  },
  table: {
    type: 'table',
    defaultWidth: 70,
    defaultHeight: 70,
    fill: '#7eb77f',
    label: 'Table',
  },
}

export const FURNITURE_CATALOG = [
  FURNITURE_STYLES.bed,
  FURNITURE_STYLES.sofa,
  FURNITURE_STYLES.table,
]
