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
    desktop: {
      position: [0, 3.8, 5.2],
      target: [0, 0, 0],
      fov: 42,
    },
    mobile: {
      position: [0, 4.2, 6.0],
      target: [0, 0, 0],
      fov: 48,
    },
  },
  {
    id: 'WORK',
    label: 'WORK',
    desktop: {
      position: [-1.8, 1.2, 2.6],
      target: [-0.8, 0.3, 0],
      fov: 34,
    },
    mobile: {
      position: [-1.6, 1.4, 3.2],
      target: [-0.6, 0.3, 0],
      fov: 40,
    },
  },
  {
    id: 'ABOUT',
    label: 'ABOUT',
    desktop: {
      position: [0.6, 5.4, 4.0],
      target: [0, 0, 0],
      fov: 38,
    },
    mobile: {
      position: [0.4, 5.8, 4.8],
      target: [0, 0, 0],
      fov: 44,
    },
  },
  {
    id: 'CONTACT',
    label: 'CONTACT',
    desktop: {
      position: [2.4, 1.8, 2.8],
      target: [1.2, 0.3, 0],
      fov: 36,
    },
    mobile: {
      position: [2.2, 2.0, 3.4],
      target: [1.0, 0.3, 0],
      fov: 42,
    },
  },
]

export const DEFAULT_DESTINATION: DestinationId = 'INDEX'
