// SVG coordinate space is 0–900 × 0–430 units.
// sculpture.scale converts SVG units → world units.
// All depth/bevel values are in SVG units; multiply by scale to get world units.
//
// World-unit reference (scale = 0.0064):
//   sculpture width  ≈ 4.75 wu   (745 SVG × 0.0064)
//   extrusion height ≈ 0.22 wu   (34 SVG × 0.0064)
//   bevel thickness  ≈ 0.022 wu  (3.4 SVG × 0.0064)

export const SCENE = {
  background: '#F2EFE9',

  floor: {
    color: '#F2EFE9',   // matches background so horizon is seamless
    roughness: 0.96,
    metalness: 0.0,
    size: 80,
  },

  sculpture: {
    color: '#A89E8E',
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.6,

    // SVG-unit depth values — see header note for world equivalents
    extrudeDepth: 34,       // → 0.218 world units of real raised height
    bevelEnabled: true,
    bevelThickness: 3.4,    // → 0.022 wu — visible edge catch-light, not chunky
    bevelSize: 2.6,         // → 0.017 wu
    bevelSegments: 4,
    curveSegments: 10,

    scale: 0.0064,
    yFloor: 0.0,
  },

  lights: {
    ambientIntensity: 1.0,
    ambientColor: '#FFF6EC',

    // Key: raking from upper-right-front — primary shadow caster
    keyColor: '#FFF8F2',
    keyIntensity: 5.5,
    keyPosition: [5, 9, 6] as [number, number, number],

    // Fill: soft cool from upper-left
    fillColor: '#EEF2FF',
    fillIntensity: 1.6,
    fillPosition: [-6, 4, 5] as [number, number, number],

    // Rim: back-high — catches top bevel edges
    rimColor: '#FFFBF5',
    rimIntensity: 1.0,
    rimPosition: [0, 7, -5] as [number, number, number],

    shadowMapSize: 2048,
    shadowBias: -0.0003,
    shadowRadius: 6,
    shadowCameraSize: 12,
  },

  contactShadow: {
    opacity: 0.52,
    blur: 1.8,
    far: 1.2,        // search 1.2 wu above the plane — covers 0.22 wu sculpture height
    resolution: 512,
    color: '#5C5244',
  },

  fog: {
    near: 12,
    far: 32,
  },

  dpr: [1, 1.5] as [number, number],

  camera: {
    near: 0.05,   // lower near to avoid clipping at tight WORK/CONTACT positions
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
    strength: 0.055,
    smoothing: 0.055,
  },
}
