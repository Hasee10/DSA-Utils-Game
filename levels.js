export const levels = [
  {
    level: 1,
    name: "Fresh Orchard",
    canvasSize: { width: 1280, height: 720 },
    layout: [
      [0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0]
    ],
    bricks: ['green', 'orange'],
    ballSpeed: 1.0,
    paddleScale: 1.0,
    fruitDropBoost: 0,
    scoreMultiplier: 1.0,
    combo: {
      enabled: false,
      timer: 6000,
      bonusScore: 200,
      visualEffect: "flashGlow"
    }
  },
  {
    level: 2,
    name: "Citrus Rush",
    canvasSize: { width: 1280, height: 720 },
    paddleScale: 0.85,
    ballSpeedMultiplier: 1.25,
    brickLayout: [
      [0,0,0,0,0,'R',0,0,0,0,0],
      [0,0,0,0,'O','O','O',0,0,0,0],
      [0,0,0,'O','G',0,'G','O',0,0,0],
      [0,0,'O','G',0,0,0,'G','O',0,0],
      [0,0,0,'O','G',0,'G','O',0,0,0],
      [0,0,0,0,'O','O','O',0,0,0,0],
      [0,0,0,0,0,'R',0,0,0,0,0]
    ],
    fruitDropBoost: 0,
    scoreMultiplier: 1.1,
    combo: {
      enabled: true,
      timer: 6000,
      bonusScore: 200,
      visualEffect: "flashGlow"
    }
  },
  {
    level: 3,
    name: "Berry Storm",
    canvasSize: { width: 1280, height: 720 },
    paddleScale: 0.75,
    ballSpeedMultiplier: 1.5,
    fruitDropBoost: 0.10,
    scoreMultiplier: 1.2,
    // 16x10 grid: 0=empty, 1=D, 2=W, 3=combo purple
    brickLayout: [
      [1,1,1,1,1,0,0,0,2,0,0,0,0,0,0,2],
      [1,0,0,0,1,0,0,0,2,0,0,0,0,0,0,2],
      [1,0,0,0,1,0,0,0,2,0,0,2,0,0,0,2],
      [1,0,0,0,1,0,0,0,2,0,2,0,2,0,0,2],
      [1,0,0,0,1,0,0,0,2,2,0,0,0,2,2,2],
      [1,1,1,1,1,0,0,0,2,0,0,0,0,0,0,2],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    combo: {
      enabled: true,
      timer: 6000,
      bonusScore: 200,
      visualEffect: "flashGlow"
    }
  },
  {
    level: 4,
    name: "Fruit Frenzy",
    canvasSize: { width: 1280, height: 720 },
    paddleScale: 0.6,
    ballSpeedMultiplier: 1.75,
    fruitDropBoost: 0.15,
    scoreMultiplier: 1.5,
    layoutType: "chaoticSymmetry",
    allowBrickRegeneration: true,
    brickRegenTime: 7000,
    combo: {
      enabled: true,
      timer: 6000,
      bonusScore: 250,
      effects: ["flash", "shake", "multiBall"],
      suppressRegen: true
    },
    powerups: true
  }
]; 