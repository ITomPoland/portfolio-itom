// Select before Canvas is created: antialias/powerPreference cannot be
// changed on an existing WebGL context by a later React effect.
export const TIERS = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

export const SETTINGS = {
  [TIERS.HIGH]: {
    dpr: [1, 1.5],
    shadows: true,
    antialias: true,
    powerPreference: 'high-performance',
    physicsStep: 1 / 60,
    textureQuality: 'high',
    particleCount: 1,
  },
  [TIERS.MEDIUM]: {
    dpr: [1, 1.25],
    shadows: false,
    antialias: true,
    powerPreference: 'default',
    physicsStep: 1 / 60,
    textureQuality: 'medium',
    particleCount: 0.6,
  },
  [TIERS.LOW]: {
    dpr: [0.8, 1],
    shadows: false,
    antialias: false,
    powerPreference: 'low-power',
    physicsStep: 1 / 45,
    textureQuality: 'low',
    particleCount: 0.3,
  },
};

export function detectPerformanceTier(device = {}) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(device.userAgent || '');
  let tier = isMobile ? TIERS.MEDIUM : TIERS.HIGH;
  if (device.hardwareConcurrency && device.hardwareConcurrency <= 4) {
    tier = isMobile ? TIERS.LOW : TIERS.MEDIUM;
  }
  if (device.deviceMemory && device.deviceMemory <= 4) tier = TIERS.LOW;
  return tier;
}

export function nextLowerTier(tier) {
  return tier === TIERS.HIGH ? TIERS.MEDIUM : TIERS.LOW;
}
