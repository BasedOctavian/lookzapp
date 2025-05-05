import { useMemo } from 'react';

// Savage descriptor matrix with gender-specific burns
const DESCRIPTORS = {
  M: {
    elite: {
      brutal: [
        { word: 'Adonis', statement: 'Gods wept when they saw you' },
        { word: 'Chad', statement: 'The gym is your second home' },
        { word: 'God-tier', statement: 'Mere mortals can only dream' },
        { word: 'Panty-dropper', statement: 'The reason for broken hearts' },
        { word: 'Alpha', statement: 'Born to lead, forced to slay' },
        { word: 'Attractive', statement: 'Mirrors break from jealousy' },
        { word: 'Handsome', statement: 'Artists fight to paint you' },
        { word: 'Stud', statement: 'The bar is set too high' },
        { word: 'Gigachad', statement: 'Evolution peaked with you' },
        { word: 'Hunk', statement: 'Sculptors take notes' },
        { word: 'Stallion', statement: 'Wild hearts chase you' },
        { word: 'Beefcake', statement: 'Protein shakes fear you' }
      ],
      gentle: [
        { word: 'Attractive', statement: 'Your presence brightens rooms' },
        { word: 'Handsome', statement: 'Grace and charm personified' },
        { word: 'Good-looking', statement: 'Nature\'s perfect balance' },
        { word: 'Charming', statement: 'Your smile is contagious' },
        { word: 'Striking', statement: 'A memorable first impression' },
        { word: 'Elegant', statement: 'Poise and confidence combined' },
        { word: 'Refined', statement: 'Class and sophistication defined' },
        { word: 'Dashing', statement: 'Style and substance united' },
        { word: 'Distinguished', statement: 'Time only enhances you' },
        { word: 'Sophisticated', statement: 'Worldly and well-composed' }
      ]
    },
    high: {
      brutal: [
        { word: 'Snack', statement: 'Quick bite of perfection' },
        { word: 'Bro', statement: 'Gym bros look up to you' },
        { word: 'Thirst-trap', statement: 'DMs are always full' },
        { word: 'Statuesque', statement: 'Marble statues envy you' },
        { word: 'Daddy', statement: 'Age like fine wine' },
        { word: 'Zaddy', statement: 'Silver fox in training' },
        { word: 'Beefy', statement: 'Protein is your best friend' },
        { word: 'Ripped', statement: 'Gym membership paid off' },
        { word: 'Jacked', statement: 'Lift heavy, look heavy' },
        { word: 'Built', statement: 'Architects take notes' }
      ],
      gentle: [
        { word: 'Attractive', statement: 'Your energy draws people in' },
        { word: 'Good-looking', statement: 'Natural charm shines through' },
        { word: 'Pleasing', statement: 'Easy on the eyes' },
        { word: 'Appealing', statement: 'Your style stands out' },
        { word: 'Charming', statement: 'Personality matches looks' },
        { word: 'Engaging', statement: 'People want to know you' },
        { word: 'Pleasant', statement: 'A joy to be around' },
        { word: 'Agreeable', statement: 'Easy to get along with' },
        { word: 'Likable', statement: 'First impressions last' }
      ]
    },
    avg: {
      brutal: [
        { word: 'NPC', statement: 'Background character energy' },
        { word: 'Normcore', statement: 'Basic is your brand' },
        { word: 'Meh-terial', statement: 'Forgettable but functional' },
        { word: 'Basic bro', statement: 'Gym? Never heard of it' },
        { word: 'Dork', statement: 'Glasses are your shield' },
        { word: 'Geek', statement: 'Comic con is home' },
        { word: 'Average', statement: 'Middle of the road' },
        { word: 'Regular', statement: 'Just another face' },
        { word: 'Plain', statement: 'Vanilla is a flavor' },
        { word: 'Generic', statement: 'Store brand looks' },
        { word: 'Standard', statement: 'Factory settings' }
      ],
      gentle: [
        { word: 'Average', statement: 'Perfectly normal and fine' },
        { word: 'Regular', statement: 'Nothing wrong with normal' },
        { word: 'Typical', statement: 'Fits right in' },
        { word: 'Standard', statement: 'Meets expectations' },
        { word: 'Normal', statement: 'Comfortably familiar' },
        { word: 'Ordinary', statement: 'Reliably consistent' },
        { word: 'Common', statement: 'Fits the mold' },
        { word: 'Usual', statement: 'Predictably pleasant' },
        { word: 'Conventional', statement: 'Follows the rules' },
        { word: 'Traditional', statement: 'Classic and reliable' }
      ]
    },
    low: {
      brutal: [
        { word: 'Soyboy', statement: 'Tofu is your protein' },
        { word: 'Cuck', statement: 'Beta energy overload' },
        { word: 'Manlet', statement: 'Step stools help' },
        { word: 'Mouthbreather', statement: 'Close your mouth' },
        { word: 'Dweeb', statement: 'Pocket protector ready' },
        { word: 'Fuckboy', statement: 'Try being genuine' },
        { word: 'Bitchboy', statement: 'Grow a backbone' },
        { word: 'Twink', statement: 'Eat a sandwich' },
        { word: 'Wanker', statement: 'Touch grass sometime' },
        { word: 'Beta', statement: 'Alpha is a dream' },
        { word: 'Simp', statement: 'Self-respect is key' },
        { word: 'Loser', statement: 'Try harder next time' },
        { word: 'Weakling', statement: 'Hit the gym maybe' },
        { word: 'Pussy', statement: 'Courage is a choice' }
      ],
      gentle: [
        { word: 'Unremarkable', statement: 'Room for improvement' },
        { word: 'Unimpressive', statement: 'Potential to grow' },
        { word: 'Mediocre', statement: 'Average with effort' },
        { word: 'Uninspiring', statement: 'Find your spark' },
        { word: 'Forgettable', statement: 'Make an impression' },
        { word: 'Unmemorable', statement: 'Stand out more' },
        { word: 'Unnoteworthy', statement: 'Time to shine' },
        { word: 'Unspectacular', statement: 'Find your moment' },
        { word: 'Unexceptional', statement: 'Break the mold' },
        { word: 'Uninspiring', statement: 'Discover your passion' }
      ]
    },
    poor: {
      brutal: [
        { word: 'Goblin', statement: 'Troll bridge is home' },
        { word: 'Neckbeard', statement: 'Shower more often' },
        { word: 'Lardass', statement: 'Hit a treadmill sometime' },
        { word: 'Sentient fart', statement: 'Air freshener needed' },
        { word: 'Incel', statement: 'Therapy might help' },
        { word: 'Loner', statement: 'Social skills 101' },
        { word: 'Loser', statement: 'Life coach needed' },
        { word: 'Dumbass', statement: 'Read a book maybe' },
        { word: 'Dickhead', statement: 'Personality transplant' },
        { word: 'Prick', statement: 'Kindness is free' },
        { word: 'Asshole', statement: 'Try being nice' },
        { word: 'Motherfucker', statement: 'Family values?' },
        { word: 'Troll', statement: 'Bridge is calling' },
        { word: 'Creep', statement: 'Personal space exists' },
        { word: 'Weirdo', statement: 'Normal is an option' },
        { word: 'Freak', statement: 'Blend in sometimes' }
      ],
      gentle: [
        { word: 'Unattractive', statement: 'Focus on inner beauty' },
        { word: 'Unappealing', statement: 'Find your unique charm' },
        { word: 'Unpleasant', statement: 'Kindness goes far' },
        { word: 'Unfavorable', statement: 'Work on first impressions' },
        { word: 'Unfortunate', statement: 'Better days ahead' },
        { word: 'Unfortunate-looking', statement: 'Style can help' },
        { word: 'Unfortunate-appearing', statement: 'Confidence is key' },
        { word: 'Unfortunate-featured', statement: 'Highlight strengths' },
        { word: 'Unfortunate-faced', statement: 'Smile more often' },
        { word: 'Unfortunate-appearing', statement: 'Posture matters' }
      ]
    }
  },
  F: {
    elite: {
      brutal: [
        { word: 'Goddess', statement: 'Mere mortals can only dream' },
        { word: 'Baddie', statement: 'The reason for broken hearts' },
        { word: 'Vixen', statement: 'Born to slay, forced to lead' },
        { word: 'Waifu', statement: 'Anime dreams come true' },
        { word: 'Queen', statement: 'The throne is yours' },
        { word: 'Bombshell', statement: 'Explosive beauty' },
        { word: 'Dime', statement: 'Perfect 10/10' },
        { word: 'Stunner', statement: 'Hearts stop when you walk by' },
        { word: 'Beauty', statement: 'Nature\'s masterpiece' },
        { word: 'Gorgeous', statement: 'Artists fight to paint you' }
      ],
      gentle: [
        { word: 'Beautiful', statement: 'Your presence brightens rooms' },
        { word: 'Lovely', statement: 'Grace and charm personified' },
        { word: 'Graceful', statement: 'Nature\'s perfect balance' },
        { word: 'Elegant', statement: 'Your smile is contagious' },
        { word: 'Radiant', statement: 'A memorable first impression' },
        { word: 'Charming', statement: 'Poise and confidence combined' },
        { word: 'Striking', statement: 'Class and sophistication defined' },
        { word: 'Refined', statement: 'Style and substance united' },
        { word: 'Sophisticated', statement: 'Time only enhances you' },
        { word: 'Exquisite', statement: 'Worldly and well-composed' }
      ]
    },
    high: {
      brutal: [
        { word: 'Bombshell', statement: 'Quick bite of perfection' },
        { word: 'Snatched', statement: 'Gym goals achieved' },
        { word: 'Yassified', statement: 'DMs are always full' },
        { word: 'Thicc', statement: 'Curves in all the right places' },
        { word: 'Baddie', statement: 'Confidence is your superpower' },
        { word: 'Cutie', statement: 'Hearts melt in your presence' },
        { word: 'Hottie', statement: 'Temperature rises when you enter' },
        { word: 'Babe', statement: 'The standard others chase' },
        { word: 'Doll', statement: 'Picture perfect in every way' },
        { word: 'Fox', statement: 'Sly and stunning' }
      ],
      gentle: [
        { word: 'Attractive', statement: 'Your energy draws people in' },
        { word: 'Pleasing', statement: 'Natural charm shines through' },
        { word: 'Appealing', statement: 'Easy on the eyes' },
        { word: 'Charming', statement: 'Your style stands out' },
        { word: 'Engaging', statement: 'Personality matches looks' },
        { word: 'Pleasant', statement: 'People want to know you' },
        { word: 'Agreeable', statement: 'A joy to be around' },
        { word: 'Winsome', statement: 'Easy to get along with' },
        { word: 'Likable', statement: 'Charm comes naturally' },
        { word: 'Delightful', statement: 'First impressions last' }
      ]
    },
    avg: {
      brutal: [
        { word: 'Butterface', statement: 'Everything but the face' },
        { word: 'Mid', statement: 'Middle of the road' },
        { word: 'NPC', statement: 'Background character energy' },
        { word: 'DMV basic', statement: 'Basic is your brand' },
        { word: 'Dork', statement: 'Glasses are your shield' },
        { word: 'Geek', statement: 'Comic con is home' },
        { word: 'Average', statement: 'Forgettable but functional' },
        { word: 'Regular', statement: 'Just another face' },
        { word: 'Plain', statement: 'Vanilla is a flavor' },
        { word: 'Generic', statement: 'Store brand looks' },
        { word: 'Standard', statement: 'Factory settings' }
      ],
      gentle: [
        { word: 'Average', statement: 'Perfectly normal and fine' },
        { word: 'Regular', statement: 'Nothing wrong with normal' },
        { word: 'Typical', statement: 'Fits right in' },
        { word: 'Standard', statement: 'Meets expectations' },
        { word: 'Normal', statement: 'Comfortably familiar' },
        { word: 'Ordinary', statement: 'Reliably consistent' },
        { word: 'Common', statement: 'Fits the mold' },
        { word: 'Usual', statement: 'Predictably pleasant' },
        { word: 'Conventional', statement: 'Follows the rules' },
        { word: 'Traditional', statement: 'Classic and reliable' }
      ]
    },
    low: {
      brutal: [
        { word: 'Smeh', statement: 'Meh with extra steps' },
        { word: 'Thot', statement: 'Try being genuine' },
        { word: 'Butterbody', statement: 'Everything but the body' },
        { word: 'Strugglebus', statement: 'Life is hard' },
        { word: 'Twat', statement: 'Personality transplant needed' },
        { word: 'Bitch', statement: 'Kindness is free' },
        { word: 'Basic', statement: 'Try being unique' },
        { word: 'Trashy', statement: 'Class is optional' },
        { word: 'Ratchet', statement: 'Standards are low' },
        { word: 'Skank', statement: 'Self-respect is key' },
        { word: 'Hoe', statement: 'Dignity is a choice' }
      ],
      gentle: [
        { word: 'Unremarkable', statement: 'Room for improvement' },
        { word: 'Unimpressive', statement: 'Potential to grow' },
        { word: 'Mediocre', statement: 'Average with effort' },
        { word: 'Uninspiring', statement: 'Find your spark' },
        { word: 'Forgettable', statement: 'Make an impression' },
        { word: 'Unmemorable', statement: 'Stand out more' },
        { word: 'Unnoteworthy', statement: 'Time to shine' },
        { word: 'Unspectacular', statement: 'Find your moment' },
        { word: 'Unexceptional', statement: 'Break the mold' },
        { word: 'Uninspiring', statement: 'Discover your passion' }
      ]
    },
    poor: {
      brutal: [
        { word: 'Landwhale', statement: 'Hit a treadmill sometime' },
        { word: 'Sloppy-supreme', statement: 'Try a shower' },
        { word: 'Thundercunt', statement: 'Therapy might help' },
        { word: 'Sentient backroll', statement: 'Gym membership needed' },
        { word: 'Cunt', statement: 'Personality transplant' },
        { word: 'Bitch', statement: 'Kindness is free' },
        { word: 'Faggot', statement: 'Be yourself' },
        { word: 'Queer', statement: 'Embrace uniqueness' },
        { word: 'Fairy', statement: 'Find your magic' },
        { word: 'Poof', statement: 'Be authentic' },
        { word: 'Tranny', statement: 'Be true to yourself' },
        { word: 'Troll', statement: 'Bridge is calling' },
        { word: 'Creep', statement: 'Personal space exists' },
        { word: 'Weirdo', statement: 'Normal is an option' },
        { word: 'Freak', statement: 'Blend in sometimes' }
      ],
      gentle: [
        { word: 'Unattractive', statement: 'Focus on inner beauty' },
        { word: 'Unappealing', statement: 'Find your unique charm' },
        { word: 'Unpleasant', statement: 'Kindness goes far' },
        { word: 'Unfavorable', statement: 'Work on first impressions' },
        { word: 'Unfortunate', statement: 'Better days ahead' },
        { word: 'Unfortunate-looking', statement: 'Style can help' },
        { word: 'Unfortunate-appearing', statement: 'Confidence is key' },
        { word: 'Unfortunate-featured', statement: 'Highlight strengths' },
        { word: 'Unfortunate-faced', statement: 'Smile more often' },
        { word: 'Unfortunate-appearing', statement: 'Posture matters' }
      ]
    }
  }
};

// Brutal body-specific roasts
const EXTRA_POOLS = {
  M: {
    short: {
      brutal: {
        high: [
          { word: 'Manlet', statement: 'Height is just a number' },
          { word: 'Hobbit', statement: 'Adventure comes in all sizes' },
          { word: 'Munchkin', statement: 'Small but mighty' },
          { word: 'Dwarf', statement: 'Strength in a small package' },
          { word: 'Midget', statement: 'Every inch counts' },
          { word: 'Runt', statement: 'Small but significant' },
          { word: 'Pipsqueak', statement: 'Tiny but tenacious' },
          { word: 'Shrimp', statement: 'Small but full of flavor' },
          { word: 'Peewee', statement: 'Compact and complete' }
        ],
        low: [
          { word: 'Manlet', statement: 'Height and face both lacking' },
          { word: 'Hobbit', statement: 'Short and unfortunate' },
          { word: 'Munchkin', statement: 'Small and unremarkable' },
          { word: 'Dwarf', statement: 'Short and plain' },
          { word: 'Midget', statement: 'Height matches face' },
          { word: 'Runt', statement: 'Small and forgettable' },
          { word: 'Pipsqueak', statement: 'Tiny and unimpressive' },
          { word: 'Shrimp', statement: 'Small and basic' },
          { word: 'Peewee', statement: 'Compact and mediocre' }
        ]
      },
      gentle: {
        high: [
          { word: 'Short', statement: 'Height is just one measure' },
          { word: 'Petite', statement: 'Elegant in every way' },
          { word: 'Compact', statement: 'Efficient and effective' },
          { word: 'Small', statement: 'Perfectly proportioned' },
          { word: 'Diminutive', statement: 'Graceful in stature' },
          { word: 'Little', statement: 'Charm in every inch' },
          { word: 'Tiny', statement: 'Delicate and defined' },
          { word: 'Miniature', statement: 'Precision in form' },
          { word: 'Mini', statement: 'Compact and complete' },
          { word: 'Small-statured', statement: 'Perfectly proportioned' }
        ],
        low: [
          { word: 'Short', statement: 'Height is just one measure' },
          { word: 'Petite', statement: 'Compact in stature' },
          { word: 'Compact', statement: 'Efficient in form' },
          { word: 'Small', statement: 'Modest in size' },
          { word: 'Diminutive', statement: 'Subtle in presence' },
          { word: 'Little', statement: 'Simple in stature' },
          { word: 'Tiny', statement: 'Basic in form' },
          { word: 'Miniature', statement: 'Plain in presence' },
          { word: 'Mini', statement: 'Modest in size' },
          { word: 'Small-statured', statement: 'Simple in form' }
        ]
      }
    },
    tall: {
      brutal: [
        { word: 'Lurch', statement: 'Towering over others' },
        { word: 'Gangly-ass', statement: 'Height comes with challenges' },
        { word: 'Stringbean', statement: 'Long and lean' },
        { word: 'Slenderman', statement: 'Mysterious height' },
        { word: 'Giraffe', statement: 'Graceful height' },
        { word: 'Beanpole', statement: 'Tall and slender' },
        { word: 'Stretch', statement: 'Reaching new heights' },
        { word: 'Lanky', statement: 'Length in every limb' },
        { word: 'Giant', statement: 'Commanding presence' },
        { word: 'Tower', statement: 'Standing tall' }
      ],
      gentle: [
        { word: 'Tall', statement: 'Commanding presence' },
        { word: 'Heightened', statement: 'Elevated stature' },
        { word: 'Elevated', statement: 'Standing above' },
        { word: 'Lofty', statement: 'Graceful height' },
        { word: 'High', statement: 'Natural advantage' },
        { word: 'Towering', statement: 'Impressive stature' },
        { word: 'Elevated', statement: 'Graceful height' },
        { word: 'Stately', statement: 'Commanding presence' },
        { word: 'Imposing', statement: 'Natural authority' },
        { word: 'Commanding', statement: 'Born to lead' }
      ]
    },
    skinny: {
      brutal: [
        { word: 'Skeletor', statement: 'Bones on display' },
        { word: 'Twig', statement: 'Fragile frame' },
        { word: 'Flatscreen', statement: 'Lacking dimension' },
        { word: 'Toothpick terror', statement: 'Delicate structure' },
        { word: 'Scrawny', statement: 'Lightweight build' },
        { word: 'Weakling', statement: 'Frail form' },
        { word: 'Pansy', statement: 'Delicate frame' },
        { word: 'Bones', statement: 'Skeletal structure' },
        { word: 'Stick', statement: 'Linear form' },
        { word: 'Rail', statement: 'Slender build' },
        { word: 'Waif', statement: 'Delicate presence' }
      ],
      gentle: [
        { word: 'Slender', statement: 'Graceful frame' },
        { word: 'Lean', statement: 'Athletic build' },
        { word: 'Slim', statement: 'Elegant form' },
        { word: 'Thin', statement: 'Delicate structure' },
        { word: 'Slight', statement: 'Refined build' },
        { word: 'Delicate', statement: 'Graceful form' },
        { word: 'Fine', statement: 'Elegant structure' },
        { word: 'Narrow', statement: 'Streamlined build' },
        { word: 'Svelte', statement: 'Graceful presence' },
        { word: 'Graceful', statement: 'Elegant form' }
      ]
    },
    overweight: {
      brutal: [
        { word: 'Lardex', statement: 'Weight is a factor' },
        { word: 'Beached whale', statement: 'Size is noticeable' },
        { word: 'Diabetesaurus', statement: 'Health is a concern' },
        { word: 'Ham planet', statement: 'Mass is significant' },
        { word: 'Obese', statement: 'Weight is a factor' },
        { word: 'Fat', statement: 'Size is noticeable' },
        { word: 'Gross', statement: 'Appearance is affected' },
        { word: 'Disgusting', statement: 'Health is a concern' },
        { word: 'Chubby', statement: 'Weight is a factor' },
        { word: 'Lard', statement: 'Size is noticeable' },
        { word: 'Porky', statement: 'Mass is significant' },
        { word: 'Tubby', statement: 'Weight is a factor' },
        { word: 'Blimp', statement: 'Size is noticeable' },
        { word: 'Whale', statement: 'Mass is significant' },
        { word: 'Blob', statement: 'Weight is a factor' },
        { word: 'Hippo', statement: 'Size is noticeable' },
        { word: 'Walrus', statement: 'Mass is significant' },
        { word: 'Butterball', statement: 'Weight is a factor' },
        { word: 'Chunk', statement: 'Size is noticeable' }
      ],
      gentle: [
        { word: 'Overweight', statement: 'Health is important' },
        { word: 'Heavy', statement: 'Weight is a factor' },
        { word: 'Large', statement: 'Size is noticeable' },
        { word: 'Big', statement: 'Presence is significant' },
        { word: 'Full-figured', statement: 'Form is complete' },
        { word: 'Ample', statement: 'Size is substantial' },
        { word: 'Substantial', statement: 'Presence is notable' },
        { word: 'Considerable', statement: 'Size is significant' },
        { word: 'Significant', statement: 'Presence is notable' },
        { word: 'Sizable', statement: 'Form is complete' }
      ]
    },
    none: {
      brutal: [
        { word: 'Humanoid', statement: 'Basic human form' },
        { word: 'Fleshy meatbag', statement: 'Standard human build' },
        { word: 'Carbon unit', statement: 'Average human form' },
        { word: 'Participation trophy', statement: 'Basic human presence' },
        { word: 'Bum', statement: 'Standard human form' },
        { word: 'Hobo', statement: 'Average human build' },
        { word: 'Drifter', statement: 'Basic human presence' },
        { word: 'Loser', statement: 'Standard human form' },
        { word: 'NPC', statement: 'Average human build' },
        { word: 'Generic', statement: 'Basic human presence' },
        { word: 'Basic', statement: 'Standard human form' },
        { word: 'Plain', statement: 'Average human build' },
        { word: 'Average', statement: 'Basic human presence' }
      ],
      gentle: [
        { word: 'Average', statement: 'Perfectly normal' },
        { word: 'Regular', statement: 'Standard human form' },
        { word: 'Typical', statement: 'Average human build' },
        { word: 'Standard', statement: 'Basic human presence' },
        { word: 'Normal', statement: 'Standard human form' },
        { word: 'Ordinary', statement: 'Average human build' },
        { word: 'Common', statement: 'Basic human presence' },
        { word: 'Usual', statement: 'Standard human form' },
        { word: 'Conventional', statement: 'Average human build' },
        { word: 'Traditional', statement: 'Basic human presence' }
      ]
    }
  },
  F: {
    short: {
      brutal: {
        high: [
          { word: 'Manlet', statement: 'Height is just a number' },
          { word: 'Hobbit', statement: 'Adventure comes in all sizes' },
          { word: 'Munchkin', statement: 'Small but mighty' },
          { word: 'Dwarf', statement: 'Strength in a small package' },
          { word: 'Midget', statement: 'Every inch counts' },
          { word: 'Runt', statement: 'Small but significant' },
          { word: 'Pipsqueak', statement: 'Tiny but tenacious' },
          { word: 'Shrimp', statement: 'Small but full of flavor' },
          { word: 'Peewee', statement: 'Compact and complete' }
        ],
        low: [
          { word: 'Manlet', statement: 'Height and face both lacking' },
          { word: 'Hobbit', statement: 'Short and unfortunate' },
          { word: 'Munchkin', statement: 'Small and unremarkable' },
          { word: 'Dwarf', statement: 'Short and plain' },
          { word: 'Midget', statement: 'Height matches face' },
          { word: 'Runt', statement: 'Small and forgettable' },
          { word: 'Pipsqueak', statement: 'Tiny and unimpressive' },
          { word: 'Shrimp', statement: 'Small and basic' },
          { word: 'Peewee', statement: 'Compact and mediocre' }
        ]
      },
      gentle: {
        high: [
          { word: 'Short', statement: 'Height is just one measure' },
          { word: 'Petite', statement: 'Elegant in every way' },
          { word: 'Compact', statement: 'Efficient and effective' },
          { word: 'Small', statement: 'Perfectly proportioned' },
          { word: 'Diminutive', statement: 'Graceful in stature' },
          { word: 'Little', statement: 'Charm in every inch' },
          { word: 'Tiny', statement: 'Delicate and defined' },
          { word: 'Miniature', statement: 'Precision in form' },
          { word: 'Mini', statement: 'Compact and complete' },
          { word: 'Small-statured', statement: 'Perfectly proportioned' }
        ],
        low: [
          { word: 'Short', statement: 'Height is just one measure' },
          { word: 'Petite', statement: 'Compact in stature' },
          { word: 'Compact', statement: 'Efficient in form' },
          { word: 'Small', statement: 'Modest in size' },
          { word: 'Diminutive', statement: 'Subtle in presence' },
          { word: 'Little', statement: 'Simple in stature' },
          { word: 'Tiny', statement: 'Basic in form' },
          { word: 'Miniature', statement: 'Plain in presence' },
          { word: 'Mini', statement: 'Modest in size' },
          { word: 'Small-statured', statement: 'Simple in form' }
        ]
      }
    },
    tall: {
      brutal: [
        { word: 'Amazon', statement: 'Towering presence' },
        { word: 'Jolly green', statement: 'Height is noticeable' },
        { word: 'Giraffe', statement: 'Graceful height' },
        { word: 'Height-hag', statement: 'Commanding stature' },
        { word: 'Giantess', statement: 'Impressive height' },
        { word: 'Beanpole', statement: 'Tall and slender' },
        { word: 'Stretch', statement: 'Reaching new heights' },
        { word: 'Lanky', statement: 'Length in every limb' },
        { word: 'Giant', statement: 'Commanding presence' },
        { word: 'Tower', statement: 'Standing tall' }
      ],
      gentle: [
        { word: 'Tall', statement: 'Commanding presence' },
        { word: 'Heightened', statement: 'Elevated stature' },
        { word: 'Elevated', statement: 'Standing above' },
        { word: 'Lofty', statement: 'Graceful height' },
        { word: 'High', statement: 'Natural advantage' },
        { word: 'Towering', statement: 'Impressive stature' },
        { word: 'Elevated', statement: 'Graceful height' },
        { word: 'Stately', statement: 'Commanding presence' },
        { word: 'Imposing', statement: 'Natural authority' },
        { word: 'Commanding', statement: 'Born to lead' }
      ]
    },
    skinny: {
      brutal: [
        { word: 'Flatty', statement: 'Lacking curves' },
        { word: 'Spindle', statement: 'Fragile frame' },
        { word: 'Skelegirl', statement: 'Bones on display' },
        { word: 'Toothpick terror', statement: 'Delicate structure' },
        { word: 'Scrawny', statement: 'Lightweight build' },
        { word: 'Weakling', statement: 'Frail form' },
        { word: 'Pansy', statement: 'Delicate frame' },
        { word: 'Emo', statement: 'Slim build' },
        { word: 'Bones', statement: 'Skeletal structure' },
        { word: 'Stick', statement: 'Linear form' },
        { word: 'Rail', statement: 'Slender build' },
        { word: 'Waif', statement: 'Delicate presence' }
      ],
      gentle: [
        { word: 'Slender', statement: 'Graceful frame' },
        { word: 'Lean', statement: 'Athletic build' },
        { word: 'Slim', statement: 'Elegant form' },
        { word: 'Thin', statement: 'Delicate structure' },
        { word: 'Slight', statement: 'Refined build' },
        { word: 'Delicate', statement: 'Graceful form' },
        { word: 'Fine', statement: 'Elegant structure' },
        { word: 'Narrow', statement: 'Streamlined build' },
        { word: 'Svelte', statement: 'Graceful presence' },
        { word: 'Graceful', statement: 'Elegant form' }
      ]
    },
    overweight: {
      brutal: [
        { word: 'Heifer', statement: 'Weight is a factor' },
        { word: 'Blubberina', statement: 'Size is noticeable' },
        { word: 'Cottage cheese queen', statement: 'Mass is significant' },
        { word: 'Dump truck', statement: 'Weight is a factor' },
        { word: 'Obese', statement: 'Size is noticeable' },
        { word: 'Fat', statement: 'Mass is significant' },
        { word: 'Gross', statement: 'Weight is a factor' },
        { word: 'Disgusting', statement: 'Size is noticeable' },
        { word: 'Chubby', statement: 'Mass is significant' },
        { word: 'Lard', statement: 'Weight is a factor' },
        { word: 'Porky', statement: 'Size is noticeable' },
        { word: 'Tubby', statement: 'Mass is significant' },
        { word: 'Blimp', statement: 'Weight is a factor' },
        { word: 'Whale', statement: 'Size is noticeable' },
        { word: 'Blob', statement: 'Mass is significant' },
        { word: 'Hippo', statement: 'Weight is a factor' },
        { word: 'Walrus', statement: 'Size is noticeable' },
        { word: 'Butterball', statement: 'Mass is significant' },
        { word: 'Chunk', statement: 'Weight is a factor' }
      ],
      gentle: [
        { word: 'Overweight', statement: 'Health is important' },
        { word: 'Heavy', statement: 'Weight is a factor' },
        { word: 'Large', statement: 'Size is noticeable' },
        { word: 'Big', statement: 'Presence is significant' },
        { word: 'Full-figured', statement: 'Form is complete' },
        { word: 'Ample', statement: 'Size is substantial' },
        { word: 'Substantial', statement: 'Presence is notable' },
        { word: 'Considerable', statement: 'Size is significant' },
        { word: 'Significant', statement: 'Presence is notable' },
        { word: 'Sizable', statement: 'Form is complete' }
      ]
    },
    none: {
      brutal: [
        { word: 'Flesh vessel', statement: 'Basic human form' },
        { word: 'Walking L', statement: 'Standard human build' },
        { word: 'Participation trophy', statement: 'Average human form' },
        { word: 'Sentient cringe', statement: 'Basic human presence' },
        { word: 'Bum', statement: 'Standard human form' },
        { word: 'Hobo', statement: 'Average human build' },
        { word: 'Drifter', statement: 'Basic human presence' },
        { word: 'Loser', statement: 'Standard human form' },
        { word: 'NPC', statement: 'Average human build' },
        { word: 'Generic', statement: 'Basic human presence' },
        { word: 'Basic', statement: 'Standard human form' },
        { word: 'Plain', statement: 'Average human build' },
        { word: 'Average', statement: 'Basic human presence' }
      ],
      gentle: [
        { word: 'Average', statement: 'Perfectly normal' },
        { word: 'Regular', statement: 'Standard human form' },
        { word: 'Typical', statement: 'Average human build' },
        { word: 'Standard', statement: 'Basic human presence' },
        { word: 'Normal', statement: 'Standard human form' },
        { word: 'Ordinary', statement: 'Average human build' },
        { word: 'Common', statement: 'Basic human presence' },
        { word: 'Usual', statement: 'Standard human form' },
        { word: 'Conventional', statement: 'Average human build' },
        { word: 'Traditional', statement: 'Basic human presence' }
      ]
    }
  }
};

// Feature-specific facial roasts
const FACE_POOLS = {
  bigNose: {
    brutal: ['Pinocchio', 'Schnoz', 'Snotrocket', 'Honker', 'Beak', 'Schnozzle', 'Nostril', 'Sniffer', 'Nosejob', 'Cyrano'],
    gentle: ['Prominent nose', 'Distinctive nose', 'Notable nose', 'Characteristic nose', 'Defined nose', 'Marked nose', 'Striking nose', 'Noticeable nose', 'Standout nose', 'Distinguished nose']
  },
  smallNose: {
    brutal: ['Button-nose', 'Pixie-sniffer', 'Pug', 'Squish', 'Snub', 'Nub', 'Noselet', 'Nostrillet', 'Nosebud', 'Nosebit'],
    gentle: ['Small nose', 'Petite nose', 'Delicate nose', 'Fine nose', 'Subtle nose', 'Refined nose', 'Elegant nose', 'Graceful nose', 'Dainty nose', 'Modest nose']
  },
  weakChin: {
    brutal: ['Chinless', 'Double-chin', 'Jelly-chin', 'Wattle', 'Gullet', 'Neckbeard', 'Jowls', 'Flap', 'Droop', 'Sag'],
    gentle: ['Soft chin', 'Gentle chin', 'Subtle chin', 'Mild chin', 'Modest chin', 'Delicate chin', 'Fine chin', 'Refined chin', 'Elegant chin', 'Graceful chin']
  },
  bigChin: {
    brutal: ['Butt-chin', 'Cleft-king', 'Jay', 'Chad', 'Jawline', 'Mandible', 'Chinny', 'Chinlet', 'Chinster', 'Chinlord'],
    gentle: ['Strong chin', 'Defined chin', 'Prominent chin', 'Distinctive chin', 'Notable chin', 'Characteristic chin', 'Marked chin', 'Striking chin', 'Noticeable chin', 'Standout chin']
  },
  closeEyes: {
    brutal: ['Cyclops', 'Bug-eye', 'Eyesore', 'Squint', 'Beady', 'Piggy', 'Tiny', 'Peepers', 'Slits', 'Narrow'],
    gentle: ['Close-set eyes', 'Narrow-set eyes', 'Compact eyes', 'Tight-set eyes', 'Near-set eyes', 'Proximate eyes', 'Adjacent eyes', 'Neighboring eyes', 'Bordering eyes', 'Adjoining eyes']
  },
  wideEyes: {
    brutal: ['Squid', 'Gorgon-eye', 'Bug', 'Owl', 'Doe', 'Saucer', 'Round', 'Bulge', 'Pop', 'Stare'],
    gentle: ['Wide-set eyes', 'Spaced eyes', 'Separated eyes', 'Distant eyes', 'Apart eyes', 'Spread eyes', 'Scattered eyes', 'Dispersed eyes', 'Distributed eyes', 'Allocated eyes']
  },
  narrowJaw: {
    brutal: ['Jawless', 'Toothpick-jaw', 'Weak', 'Soft', 'Delicate', 'Frail', 'Tiny', 'Narrow', 'Slim', 'Fine'],
    gentle: ['Narrow jaw', 'Slender jaw', 'Fine jaw', 'Delicate jaw', 'Subtle jaw', 'Refined jaw', 'Elegant jaw', 'Graceful jaw', 'Dainty jaw', 'Modest jaw']
  },
  wideJaw: {
    brutal: ['Butcher-jaw', 'Hatchet-face', 'Square', 'Block', 'Brick', 'Slab', 'Wide', 'Broad', 'Massive', 'Huge'],
    gentle: ['Wide jaw', 'Broad jaw', 'Strong jaw', 'Defined jaw', 'Prominent jaw', 'Distinctive jaw', 'Notable jaw', 'Characteristic jaw', 'Marked jaw', 'Striking jaw']
  },
  highCheeks: {
    brutal: ['Hamster-cheeks', 'Cheekpopper', 'Chipmunk', 'Puffy', 'Round', 'Full', 'Plump', 'Chubby', 'Pillow', 'Cushion'],
    gentle: ['High cheekbones', 'Elevated cheeks', 'Prominent cheeks', 'Defined cheeks', 'Distinctive cheeks', 'Notable cheeks', 'Characteristic cheeks', 'Marked cheeks', 'Striking cheeks', 'Noticeable cheeks']
  },
  lowCheeks: {
    brutal: ['Pancake-face', 'Flat-cheeks', 'Saggy', 'Droopy', 'Hollow', 'Sunken', 'Gaunt', 'Skeletal', 'Bony', 'Thin'],
    gentle: ['Low cheekbones', 'Subtle cheeks', 'Gentle cheeks', 'Soft cheeks', 'Mild cheeks', 'Modest cheeks', 'Delicate cheeks', 'Fine cheeks', 'Refined cheeks', 'Elegant cheeks']
  },
  ugly: {
    brutal: ['Hideous', 'Creep', 'Weirdo', 'Freak', 'Monster', 'Beast', 'Ogre', 'Troll', 'Gremlin', 'Goblin', 'Ghoul', 'Demon', 'Abomination'],
    gentle: ['Unattractive', 'Unappealing', 'Unpleasant', 'Unfavorable', 'Unfortunate', 'Unfortunate-looking', 'Unfortunate-appearing', 'Unfortunate-featured', 'Unfortunate-faced', 'Unfortunate-appearing']
  },
  dumb: {
    brutal: ['Moron', 'Idiot', 'Imbecile', 'Dumbbell', 'Dick', 'Dickhead', 'Dunce', 'Simpleton', 'Fool', 'Nitwit', 'Dolt', 'Dullard', 'Blockhead'],
    gentle: ['Unintelligent', 'Unwise', 'Uninformed', 'Unknowledgeable', 'Uneducated', 'Unlearned', 'Unschooled', 'Untaught', 'Uninstructed', 'Untrained']
  }
};

// Utility to pick random
const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

const useOneWordDescription = ({ overallRating, faceRating, testScores, measurements, height, weight, gender }) => {
  return useMemo(() => {
    // Generate both gentle and brutal descriptions
    const gentleDescription = generateDescription(false);
    const brutalDescription = generateDescription(true);

    return {
      gentle: gentleDescription,
      brutal: brutalDescription
    };

    function generateDescription(isBrutal) {
      if (!overallRating && !faceRating && !testScores && !measurements && !height && !weight && !gender) {
        return { word: 'Scanning...', statement: 'Analyzing your features' };
      }

      const g = gender === 'F' ? 'F' : 'M';
      const pool = DESCRIPTORS[g];
      const extra = EXTRA_POOLS[g];

      // Calculate rating first
      const rating =
        overallRating != null
          ? overallRating
          : faceRating != null
          ? faceRating
          : Object.keys(testScores).length
          ? Object.values(testScores).reduce((a, b) => a + b, 0) / Object.keys(testScores).length
          : null;

      // 1️⃣ Height/weight restrictions and body archetype descriptors
      if (height != null && weight != null) {
        const bmi = (weight / (height * height)) * 703;
        // For very short men, prioritize height-based descriptors
        if (gender === 'M' && height < 68) {
          const faceScore = faceRating || overallRating || 50;
          const category = faceScore >= 60 ? 'high' : 'low';
          return getRandom(extra.short[isBrutal ? 'brutal' : 'gentle'][category]);
        }
        if (height > 74) return getRandom(extra.tall[isBrutal ? 'brutal' : 'gentle']);
        if (bmi < 18.5) return getRandom(extra.skinny[isBrutal ? 'brutal' : 'gentle']);
        if (bmi >= 30) return getRandom(extra.overweight[isBrutal ? 'brutal' : 'gentle']);
        if (bmi >= 25) return getRandom(extra.overweight[isBrutal ? 'brutal' : 'gentle']);
      }

      // 2️⃣ Rating-based burns
      if (rating != null) {
        if (rating >= 90) return getRandom(pool.elite[isBrutal ? 'brutal' : 'gentle']);
        if (rating >= 70) return getRandom(pool.high[isBrutal ? 'brutal' : 'gentle']);
        if (rating >= 50) return getRandom(pool.avg[isBrutal ? 'brutal' : 'gentle']);
        if (rating >= 30) return getRandom(pool.low[isBrutal ? 'brutal' : 'gentle']);
        return getRandom(pool.poor[isBrutal ? 'brutal' : 'gentle']);
      }

      // 3️⃣ Feature-specific burns
      const {
        carnalTiltAngle,
        cheekboneLocation,
        chinLength,
        facialThirdsRatio,
        interocularRatio,
        jawRatio,
        noseWidth,
        faceWidth,
        chinRatio,
        eyeDistance,
        jawWidth,
        leftCheekHeight,
        rightCheekHeight,
        faceHeightFull
      } = measurements;

      // Tilt extremes
      if (carnalTiltAngle != null) {
        if (carnalTiltAngle > 45) return {
          word: 'Tilted',
          statement: 'Your head is noticeably tilted'
        };
        if (carnalTiltAngle < -45) return {
          word: 'Tilted',
          statement: 'Your head tilt is extreme'
        };
      }
      // Cheekbone high/low
      if (cheekboneLocation != null) {
        if (cheekboneLocation > 90) return {
          word: 'High-cheeked',
          statement: 'You have prominent cheekbones'
        };
        if (cheekboneLocation < 50) return {
          word: 'Low-cheeked',
          statement: 'Your cheekbones are set low'
        };
      }
      // Chin length
      if (chinLength != null) {
        if (chinLength > 50) return {
          word: 'Strong-chinned',
          statement: 'You have a strong chin'
        };
        if (chinLength < 30) return {
          word: 'Soft-chinned',
          statement: 'You have a soft chin'
        };
      }
      // Facial thirds skew
      if (facialThirdsRatio != null) {
        if (facialThirdsRatio > 1.5) return {
          word: 'Long-faced',
          statement: 'You have a long face shape'
        };
        if (facialThirdsRatio < 1) return {
          word: 'Short-faced',
          statement: 'You have a short face shape'
        };
      }
      // Interocular width
      if (interocularRatio != null) {
        if (interocularRatio > 0.35) return {
          word: 'Wide-eyed',
          statement: 'Your eyes are set wide apart'
        };
        if (interocularRatio < 0.25) return {
          word: 'Close-eyed',
          statement: 'Your eyes are set close together'
        };
      }
      // Jaw width
      if (jawRatio != null) {
        if (jawRatio > 0.7) return {
          word: 'Strong-jawed',
          statement: 'You have a strong jawline'
        };
        if (jawRatio < 0.4) return {
          word: 'Narrow-jawed',
          statement: 'You have a narrow jawline'
        };
      }
      // Nose size
      if (noseWidth && faceWidth) {
        const nr = noseWidth / faceWidth;
        if (nr > 0.2) return getRandom(FACE_POOLS.bigNose[isBrutal ? 'brutal' : 'gentle']);
        if (nr < 0.1) return getRandom(FACE_POOLS.smallNose[isBrutal ? 'brutal' : 'gentle']);
      }
      // Chin prominence
      if (chinRatio != null) {
        if (chinRatio < 0.3) return getRandom(FACE_POOLS.weakChin[isBrutal ? 'brutal' : 'gentle']);
        if (chinRatio > 0.5) return getRandom(FACE_POOLS.bigChin[isBrutal ? 'brutal' : 'gentle']);
      }
      // Eye spacing
      if (eyeDistance && faceWidth) {
        const er = eyeDistance / faceWidth;
        if (er > 0.4) return getRandom(FACE_POOLS.wideEyes[isBrutal ? 'brutal' : 'gentle']);
        if (er < 0.3) return getRandom(FACE_POOLS.closeEyes[isBrutal ? 'brutal' : 'gentle']);
      }
      // Jaw-to-face ratio
      if (jawWidth && faceWidth) {
        const jr2 = jawWidth / faceWidth;
        if (jr2 > 0.6) return getRandom(FACE_POOLS.wideJaw[isBrutal ? 'brutal' : 'gentle']);
        if (jr2 < 0.35) return getRandom(FACE_POOLS.narrowJaw[isBrutal ? 'brutal' : 'gentle']);
      }
      // Cheek height
      if (leftCheekHeight && rightCheekHeight && faceHeightFull) {
        const avgC = (leftCheekHeight + rightCheekHeight) / 2;
        const cr = avgC / faceHeightFull;
        if (cr > 0.35) return getRandom(FACE_POOLS.highCheeks[isBrutal ? 'brutal' : 'gentle']);
        if (cr < 0.25) return getRandom(FACE_POOLS.lowCheeks[isBrutal ? 'brutal' : 'gentle']);
      }

      // 4️⃣ Ugly/dumb catch-all for extreme lows
      if ((overallRating || faceRating || 100) < 20) {
        return getRandom(FACE_POOLS.ugly[isBrutal ? 'brutal' : 'gentle']);
      }
      if ((testScores.iq || 100) < 70) {
        return getRandom(FACE_POOLS.dumb[isBrutal ? 'brutal' : 'gentle']);
      }

      // 5️⃣ Facial symmetry vibe check
      const { carnalTiltAngle: t, facialThirdsRatio: thirds2, cheekHeightDiff } = measurements;
      if (t != null && thirds2 != null && cheekHeightDiff != null) {
        if (t < 2 && thirds2 > 0.9 && thirds2 < 1.1 && cheekHeightDiff < 5) {
          return getRandom(pool.high[isBrutal ? 'brutal' : 'gentle']);
        }
        return getRandom(pool.avg[isBrutal ? 'brutal' : 'gentle']);
      }

      // 6️⃣ Nothing stands out
      return getRandom(extra.none[isBrutal ? 'brutal' : 'gentle']);
    }
  }, [overallRating, faceRating, testScores, measurements, height, weight, gender]);
};

export default useOneWordDescription;
