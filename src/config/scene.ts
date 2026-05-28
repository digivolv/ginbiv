export const SCENE = {
  background: '#F2EFE9',
  floor: {
    // Same tone as background — the shadow/ContactShadow defines the surface, not the color
    color: '#F2EFE9',
    roughness: 0.96,
    metalness: 0.0,
    size: 60,
  },
  sculpture: {
    color: '#A89E8E',
    roughness: 0.80,
    metalness: 0.02,
    extrudeDepth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.030,
    bevelSize: 0.022,
    bevelSegments: 5,
    curveSegments: 10,
    scale: 0.0062,
    yFloor: 0.0,
  },
  lights: {
    // Low ambient — just enough to lift shadows off pure black
    ambientIntensity: 0.9,
    ambientColor: '#FFF6EC',

    // Key: strong, raking from upper-right-front — casts long dramatic shadows
    keyColor: '#FFF8F2',
    keyIntensity: 6.5,
    keyPosition: [5, 9, 6] as [number, number, number],

    // Fill: soft cool from opposite side — prevents deep black shadows on left faces
    fillColor: '#EEF2FF',
    fillIntensity: 1.8,
    fillPosition: [-6, 4, 5] as [number, number, number],

    // Rim: back-high, warms the top bevel edges
    rimColor: '#FFFBF5',
    rimIntensity: 1.2,
    rimPosition: [0, 8, -4] as [number, number, number],

    // Shadow map config
    shadowMapSize: 2048,
    shadowBias: -0.0003,
    shadowRadius: 8,
    shadowCameraSize: 10,
  },
  contactShadow: {
    opacity: 0.48,
    blur: 2.0,
    far: 2.2,
    resolution: 512,
    color: '#5C5244',
  },
  dpr: [1, 1.5] as [number, number],
  camera: {
    near: 0.1,
    far: 60,
  },
  transition: {
    duration: 1.6,
    ease: 'power3.inOut',
    reducedMotionDuration: 0.001,
    revealDuration: 2.2,
    revealEase: 'power2.out',
  },
  parallax: {
    strength: 0.06,
    smoothing: 0.06,
  },
}
