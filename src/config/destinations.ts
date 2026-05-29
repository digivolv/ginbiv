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
    // Establishing: full EL readable, oblique elevation, generous sky above
    desktop: {
      position: [0.3, 3.0, 4.6],
      target: [0, 0.11, 0],
      fov: 44,
    },
    mobile: {
      position: [0, 1.2, 4.0],
      target: [0, 0.11, 0],
      fov: 58,
    },
  },
  {
    id: 'WORK',
    label: 'WORK',
    // Close left-front oblique: E letter form readable, extrusion wall height prominent
    desktop: {
      position: [-2.2, 1.2, 2.8],
      target: [-0.3, 0.11, 0],
      fov: 36,
    },
    mobile: {
      position: [-1.8, 1.1, 3.4],
      target: [-0.3, 0.12, 0],
      fov: 46,
    },
  },
  {
    id: 'ABOUT',
    label: 'ABOUT',
    // Near vertical plan: both letters as pure graphic shapes from above
    desktop: {
      position: [0.3, 5.4, 1.0],
      target: [0, 0, -0.3],
      fov: 42,
    },
    mobile: {
      position: [0.2, 4.6, 2.4],
      target: [0, 0, 0],
      fov: 58,
    },
  },
  {
    id: 'CONTACT',
    label: 'CONTACT',
    // Close right-front oblique: L letter form and terminal clearly readable, intimate scale
    desktop: {
      position: [2.6, 1.2, 2.6],
      target: [0.75, 0.11, 0],
      fov: 32,
    },
    mobile: {
      position: [2.4, 0.7, 3.0],
      target: [0.8, 0.12, 0],
      fov: 48,
    },
  },
]

export const DEFAULT_DESTINATION: DestinationId = 'INDEX'
