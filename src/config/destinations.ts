export type DestinationId = 'INDEX' | 'WORK' | 'ABOUT' | 'CONTACT'

export interface CameraPose {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export interface Destination {
  id: DestinationId
  label: string
  desktop: CameraPose
  mobile: CameraPose
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'INDEX',
    label: 'INDEX',
    // Iconic establishing: full EL visible, generous negative space, oblique elevation
    desktop: {
      position: [0.2, 3.2, 4.8],
      target: [0, 0.08, 0],
      fov: 44,
    },
    mobile: {
      position: [0, 2.0, 4.0],
      target: [0, 0.28, 0],
      fov: 64,
    },
  },
  {
    id: 'WORK',
    label: 'WORK',
    // Architectural: very close to E's raised edge, dramatic bevel reveal
    desktop: {
      position: [-1.6, 0.78, 1.85],
      target: [-0.5, 0.16, -0.08],
      fov: 34,
    },
    mobile: {
      position: [-1.2, 0.9, 2.5],
      target: [-0.3, 0.14, 0.1],
      fov: 46,
    },
  },
  {
    id: 'ABOUT',
    label: 'ABOUT',
    // Elevated: clear top-down with strong diagonal, both letters together from height
    desktop: {
      position: [0.6, 5.2, 1.8],
      target: [0, 0.1, -0.4],
      fov: 40,
    },
    mobile: {
      position: [0.3, 4.6, 2.8],
      target: [0, 0.15, -0.1],
      fov: 58,
    },
  },
  {
    id: 'CONTACT',
    label: 'CONTACT',
    // Intimate: gliding close to the L's terminal stroke, almost touching the floor
    desktop: {
      position: [2.1, 1.05, 2.1],
      target: [0.85, 0.12, -0.05],
      fov: 32,
    },
    mobile: {
      position: [1.9, 1.3, 2.9],
      target: [0.8, 0.15, 0.1],
      fov: 48,
    },
  },
]

export const DEFAULT_DESTINATION: DestinationId = 'INDEX'
