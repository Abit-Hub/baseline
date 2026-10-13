export const SKILLS = [
  'Forehand',
  'Backhand',
  'Serve',
  'Return',
  'Volley',
  'Footwork',
  'Fitness',
  'Match play',
] as const

export const RATINGS = ['Struggled', 'Shaky', 'Steady', 'Solid', 'Sharp'] as const

// Offered once to a brand-new log so the Drills page is not empty.
export const STARTER_DRILLS = [
  { skill: 'Forehand', name: 'Shadow swings, 3 sets of 10', description: 'Slow motion, finish over the opposite shoulder.' },
  { skill: 'Forehand', name: 'Wall rally, 5 minutes', description: 'Steady pace. Aim for 20 in a row.' },
  { skill: 'Backhand', name: 'Shadow swings, 3 sets of 10', description: 'Turn the shoulders early.' },
  { skill: 'Serve', name: 'Toss-only practice, 20 tosses', description: 'The ball should land in the same spot every time.' },
  { skill: 'Footwork', name: 'Split step and recover', description: 'Small hop as the ball is hit, then return to the centre.' },
  { skill: 'Fitness', name: 'Dynamic warm-up, 5 minutes', description: 'Arm circles, leg swings, light jog.' },
]
