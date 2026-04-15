import type { StructuralMaterial } from '../types/world'

export const STRUCTURAL_MATERIALS: Array<{
  value: StructuralMaterial
  label: string
  color: string
}> = [
  {
    value: 'wood',
    label: 'Wood',
    color: '#9b6b43',
  },
  {
    value: 'steel',
    label: 'Steel',
    color: '#8c98a8',
  },
]

export const STRUCTURAL_MATERIAL_COLORS: Record<StructuralMaterial, string> = {
  wood: '#9b6b43',
  steel: '#8c98a8',
}
