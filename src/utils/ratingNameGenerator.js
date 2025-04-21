// Score ranges for different tiers
const SCORE_RANGES = {
    EXCEPTIONAL: 85,
    ABOVE_AVERAGE: 75,
    AVERAGE: 65,
    BELOW_AVERAGE: 55
  };
  
  // Gender-specific overall descriptors (Gen Z-coded)
  const CASUAL_OVERALL_DESCRIPTORS = {
    M: {
      EXCEPTIONAL: [
        "God Tier", "Absolute Slay", "Peak Vibes", "Alpha Energy", "Top G",
        "Certified Legend", "Unmatched Aura", "King of the Scene", "Elite Status", "GOAT Material",
        "Big Dick Energy", "Slaps Harder Than Will Smith", "Drip Lord", "Unbeatable Chad", "10/10 No Cap",
        "Facecard Never Declines", "Built Different", "Aura on 1000", "Main Character Energy", "Vibe Check Passed"
      ],
      ABOVE_AVERAGE: [
        "Solid", "Above Mid", "Lowkey Fire", "Bro’s Got It", "Certified Chad",
        "Respectable", "Not Bad at All", "Better Than Most", "Solid 8/10", "Worthy of a Follow",
        "Kinda Slaps", "Serving Looks", "Not Too Shabby", "Bro’s Popping Off", "Lowkey a W",
        "Facecard Valid", "Hits Different", "Pretty Decent", "Above the Curve", "Vibes Are Strong"
      ],
      AVERAGE: [
        "Mid", "It’s Giving Okay", "Standard Fit", "Average Joe", "Just a Guy",
        "Nothing Special", "Meh", "Could Be Worse", "Not Standing Out", "Background Character",
        "It’s Fine I Guess", "Just Existing", "Basic Bro", "NPC Energy", "Middle of the Pack",
        "Facecard Pending", "Not a W or L", "Whatever", "Plain Toast", "Doesn’t Slap"
      ],
      BELOW_AVERAGE: [
        "Unique Glow", "One of a Kind", "Special Sauce", "Quirky King", "Meme Material",
        "Built Like a Meme", "Facecard Declined", "Certified L", "Bro What Happened", "Yikes Energy",
        "Giving Side Character", "Not It Chief", "Oof Size Large", "Vibe Check Failed", "Sus AF",
        "Low Battery Mode", "Error 404: Looks Not Found", "Caught Lacking", "Down Bad", "Bruh Moment"
      ]
    },
    W: {
      EXCEPTIONAL: [
        "God Tier", "Absolute Slay", "Peak Vibes", "Queen Energy", "Main Character",
        "Certified Icon", "Unmatched Aura", "Goddess Vibes", "Elite Status", "GOAT Material",
        "Slay Queen", "Facecard Never Declines", "Serving Face 24/7", "Vibe Check Cleared", "Aura on Fleek",
        "Baddie Energy", "10/10 No Filter", "Pop Off Sis", "Unbothered and Thriving", "She Ate That"
      ],
      ABOVE_AVERAGE: [
        "Solid", "Above Mid", "Lowkey Fire", "Girl’s Got It", "Certified Baddie",
        "Respectable", "Not Bad at All", "Better Than Most", "Solid 8/10", "Worthy of a Follow",
        "Kinda Ate", "Serving Light Looks", "Pretty Cute", "Lowkey a W", "Facecard Valid",
        "She’s That Girl", "Vibes Are Decent", "Above the Bar", "Not Too Shabby", "Glow Up Real"
      ],
      AVERAGE: [
        "Mid", "It’s Giving Okay", "Standard Fit", "Girl Next Door", "Just a Gal",
        "Nothing Special", "Meh", "Could Be Worse", "Not Standing Out", "Background Character",
        "It’s Fine I Guess", "Just There", "Basic Babe", "NPC Vibes", "Middle Ground",
        "Facecard Pending", "Not a W or L", "Eh Whatever", "Plain Jane", "Doesn’t Pop Off"
      ],
      BELOW_AVERAGE: [
        "Unique Glow", "One of a Kind", "Special Sauce", "Quirky Queen", "Meme Material",
        "Built Like a TikTok", "Facecard Declined", "Certified L", "Sis What’s This", "Yikes Vibes",
        "Giving Extra", "Not the Vibe", "Oof Energy", "Vibe Check Bounced", "Sus Queen",
        "Lowkey a Mess", "404: Slay Not Found", "Caught Slipping", "Down Bad Sis", "Big Oof"
      ]
    }
  };
  
  // Feature-specific phrases with variety, including physical attributes
  const FEATURE_PHRASES = {
    'Carnal Tilt': {
      high: [
        "Eyes That Could Steal Your Soul", "Eyes That Launch a Thousand Ships", "Eyes That Make Hearts Skip",
        "Eyes Straight Outta a Rom-Com", "Eyes That Hypnotize the Room", "Eyes That Are TikTok Famous",
        "Eyes That Slap Harder Than a Beat Drop", "Eyes That Glow Like LED", "Eyes That Are Unreal",
        "Eyes That Could Get a Million Likes", "Eyes That Are Built Different", "Eyes That Say ‘Bet’",
        "Eyes That Are a Whole Mood", "Eyes That Are Too OP", "Eyes That Are Giving Main Character",
        "Eyes That Are a Vibe Check Win", "Eyes That Are Straight Fire", "Eyes That Could Pull Anyone",
        "Eyes That Are 10/10 No Cap", "Eyes That Are Slay City"
      ],
      low: [
        "Eyes That Say ‘I Need a Nap’", "Eyes That Look Like They’re Done", "Eyes Too Close for Comfort",
        "Eyes That Are a Bit Sus", "Eyes That Missed the Memo", "Eyes That Are Low Battery",
        "Eyes That Are Giving Tired", "Eyes That Are a Solid L", "Eyes That Are Not It",
        "Eyes That Are Kinda Meh", "Eyes That Are Built Weird", "Eyes That Are Off-Brand",
        "Eyes That Are a Vibe Crash", "Eyes That Are Big Oof", "Eyes That Are Nope.com",
        "Eyes That Are Caught Lacking", "Eyes That Are a Hard Pass", "Eyes That Are Yikes",
        "Eyes That Are a Meme Gone Wrong", "Eyes That Are Down Bad"
      ]
    },
    'Cheekbone Location': {
      M: {
        high: [
          "Cheekbones That Could Cut Glass", "Cheekbones Sharp Enough to Shave", "Cheekbones That Are Chad Tier",
          "Cheekbones That Slap Harder Than a Diss", "Cheekbones That Are Peak Masculinity", "Cheekbones That Are GOATed",
          "Cheekbones That Could Flex on Anyone", "Cheekbones That Are Built Like a Tank", "Cheekbones That Are Too Clean",
          "Cheekbones That Are Giving Alpha", "Cheekbones That Are Razor Sharp", "Cheekbones That Are Unmatched",
          "Cheekbones That Are a Power Move", "Cheekbones That Are Straight W", "Cheekbones That Are Top Shelf",
          "Cheekbones That Are Facecard Approved", "Cheekbones That Are Absolute Fire", "Cheekbones That Are Legendary",
          "Cheekbones That Are Bro Code", "Cheekbones That Are 100% Drip"
        ],
        low: [
          "Cheekbones on Stealth Mode", "Cheekbones That Ghosted Us", "Cheekbones That Are Lowkey Missing",
          "Cheekbones That Are Taking a Nap", "Cheekbones That Are Built Soft", "Cheekbones That Are Just Meh",
          "Cheekbones That Are Not Popping", "Cheekbones That Are a Bit Mid", "Cheekbones That Are No Show",
          "Cheekbones That Are Caught Slipping", "Cheekbones That Are Barely There", "Cheekbones That Are a L",
          "Cheekbones That Are Vibe Check Failed", "Cheekbones That Are Down Bad", "Cheekbones That Are Oof",
          "Cheekbones That Are NPC Status", "Cheekbones That Are Sus AF", "Cheekbones That Are Nope",
          "Cheekbones That Are Low Effort", "Cheekbones That Are Facecard Denied"
        ]
      },
      W: {
        high: [
          "Cheekbones That Could Grace a Runway", "Cheekbones That Are Baddie Approved", "Cheekbones That Slay All Day",
          "Cheekbones That Are TikTok Ready", "Cheekbones That Are Queen Vibes", "Cheekbones That Are Too Pretty",
          "Cheekbones That Are Serving Face", "Cheekbones That Are High Fashion", "Cheekbones That Are 10/10",
          "Cheekbones That Are Glow Up Goals", "Cheekbones That Are Elegant AF", "Cheekbones That Are Popping Off",
          "Cheekbones That Are Straight Fire", "Cheekbones That Are Facecard Valid", "Cheekbones That Are Iconic",
          "Cheekbones That Are Giving Life", "Cheekbones That Are Slay Queen", "Cheekbones That Are Unreal",
          "Cheekbones That Are Vibe Check Passed", "Cheekbones That Are Sheer Perfection"
        ],
        low: [
          "Cheekbones on Stealth Mode", "Cheekbones That Dipped Out", "Cheekbones That Are Lowkey Gone",
          "Cheekbones That Are Taking a Break", "Cheekbones That Are Soft Sis", "Cheekbones That Are Just There",
          "Cheekbones That Are Not Serving", "Cheekbones That Are Kinda Mid", "Cheekbones That Are No Slay",
          "Cheekbones That Are Caught Lacking", "Cheekbones That Are Barely Vibing", "Cheekbones That Are a L",
          "Cheekbones That Are Vibe Check Bounced", "Cheekbones That Are Down Bad", "Cheekbones That Are Oof",
          "Cheekbones That Are NPC Energy", "Cheekbones That Are Sus Vibes", "Cheekbones That Are Nope",
          "Cheekbones That Are Low Effort", "Cheekbones That Are Facecard Declined"
        ]
      }
    },
    'Chin': {
      M: {
        high: [
          "Chin That Runs the Show", "Chin That Could Punch Through Walls", "Chin That’s Alpha As Hell",
          "Chin That’s Built Like a Brick", "Chin That’s Top G Certified", "Chin That’s a Powerhouse",
          "Chin That’s Giving Big Energy", "Chin That’s Straight W", "Chin That’s Unbreakable",
          "Chin That’s Facecard Approved", "Chin That’s Peak Bro", "Chin That’s Too Strong",
          "Chin That’s a Total Slap", "Chin That’s Legendary", "Chin That’s Chad Mode",
          "Chin That’s Absolute Fire", "Chin That’s Built Different", "Chin That’s a Vibe King",
          "Chin That’s No Cap Goals", "Chin That’s 100% Drip"
        ],
        low: [
          "Chin That’s Keeping It Chill", "Chin That’s Lowkey Hiding", "Chin That’s Not Even Trying",
          "Chin That’s Built Soft", "Chin That’s Just Vibing", "Chin That’s a Bit Mid",
          "Chin That’s Not Popping Off", "Chin That’s Taking a Day Off", "Chin That’s Meh",
          "Chin That’s Caught Slipping", "Chin That’s Barely There", "Chin That’s a Solid L",
          "Chin That’s Vibe Check Failed", "Chin That’s Down Bad", "Chin That’s Oof Energy",
          "Chin That’s NPC Status", "Chin That’s Sus AF", "Chin That’s Nope.com",
          "Chin That’s Low Battery", "Chin That’s Facecard Denied"
        ]
      },
      W: {
        high: [
          "Chin That Runs the Show", "Chin That’s Queen Energy", "Chin That’s Serving Looks",
          "Chin That’s Too Pretty to Handle", "Chin That’s Baddie Tier", "Chin That’s Elegant Slay",
          "Chin That’s Facecard Valid", "Chin That’s a Total Glow", "Chin That’s Popping Off",
          "Chin That’s Straight Fire", "Chin That’s Giving Life", "Chin That’s Iconic Vibes",
          "Chin That’s She Ate That", "Chin That’s 10/10 No Filter", "Chin That’s High Class",
          "Chin That’s Absolute Goals", "Chin That’s Built Different", "Chin That’s Vibe Queen",
          "Chin That’s No Cap Slay", "Chin That’s 100% Glow"
        ],
        low: [
          "Chin That’s Keeping It Chill", "Chin That’s Lowkey Dipping", "Chin That’s Not Serving",
          "Chin That’s Built Soft", "Chin That’s Just There", "Chin That’s Kinda Mid",
          "Chin That’s Not Popping", "Chin That’s Taking a Nap", "Chin That’s Meh Vibes",
          "Chin That’s Caught Lacking", "Chin That’s Barely Showing", "Chin That’s a L",
          "Chin That’s Vibe Check Bounced", "Chin That’s Down Bad", "Chin That’s Oof",
          "Chin That’s NPC Energy", "Chin That’s Sus Queen", "Chin That’s Nope",
          "Chin That’s Low Effort", "Chin That’s Facecard Declined"
        ]
      }
    },
    'Facial Thirds': {
      high: [
        "Proportions Straight Outta a Filter", "Proportions That Are God Tier", "Proportions That Slap",
        "Proportions That Are Too Perfect", "Proportions That Are Built Different", "Proportions That Are 10/10",
        "Proportions That Are Facecard Valid", "Proportions That Are Unreal", "Proportions That Are TikTok Goals",
        "Proportions That Are Serving", "Proportions That Are Golden Ratio Vibes", "Proportions That Are Flawless",
        "Proportions That Are Absolute Fire", "Proportions That Are No Cap", "Proportions That Are Vibe Check Win",
        "Proportions That Are Straight W", "Proportions That Are Legendary", "Proportions That Are Slay City",
        "Proportions That Are Too Clean", "Proportions That Are Perfection"
      ],
      low: [
        "Proportions Doing Their Own Thing", "Proportions That Are a Bit Off", "Proportions That Are Sus",
        "Proportions That Are Lowkey Messy", "Proportions That Are Built Weird", "Proportions That Are Mid",
        "Proportions That Are Not It", "Proportions That Are a Solid L", "Proportions That Are Oof",
        "Proportions That Are Caught Lacking", "Proportions That Are Vibe Check Failed", "Proportions That Are Nope",
        "Proportions That Are Down Bad", "Proportions That Are Big Yikes", "Proportions That Are Unmatched",
        "Proportions That Are Facecard Denied", "Proportions That Are a Meme", "Proportions That Are Quirky",
        "Proportions That Are Low Battery", "Proportions That Are Bruh"
      ]
    },
    'Interocular Distance': {
      high: [
        "Eyes Spaced Like They’re VIP", "Eyes That Are Perfectly Placed", "Eyes That Are Built Elite",
        "Eyes That Are Too Clean", "Eyes That Are TikTok Ready", "Eyes That Are Facecard Approved",
        "Eyes That Are 10/10 No Cap", "Eyes That Are Absolute Slay", "Eyes That Are Vibe Check Passed",
        "Eyes That Are Golden Ratio", "Eyes That Are Straight Fire", "Eyes That Are Unreal",
        "Eyes That Are Serving Looks", "Eyes That Are Top Tier", "Eyes That Are Flawless",
        "Eyes That Are Giving Energy", "Eyes That Are No Filter Needed", "Eyes That Are Legendary",
        "Eyes That Are Built Different", "Eyes That Are Slap City"
      ],
      low: [
        "Eyes That RSVP’d Separately", "Eyes That Are Too Close For Vibes", "Eyes That Are Built Off",
        "Eyes That Are Lowkey Sus", "Eyes That Are Not Quite Right", "Eyes That Are Mid Energy",
        "Eyes That Are a Bit Oof", "Eyes That Are Caught Lacking", "Eyes That Are Vibe Check Failed",
        "Eyes That Are Down Bad", "Eyes That Are Nope AF", "Eyes That Are Facecard Denied",
        "Eyes That Are a Meme Moment", "Eyes That Are Big Yikes", "Eyes That Are Quirky",
        "Eyes That Are Low Battery", "Eyes That Are Bruh Mode", "Eyes That Are Not It",
        "Eyes That Are a Hard Pass", "Eyes That Are Weird Flex"
      ]
    },
    'Jawline': {
      M: {
        high: [
          "Jawline That Could Slice Bread", "Jawline That’s Chad Tier", "Jawline That Cuts Like a Knife",
          "Jawline That’s Built Like Steel", "Jawline That’s Alpha Energy", "Jawline That’s Too Sharp",
          "Jawline That’s Facecard Valid", "Jawline That’s Straight W", "Jawline That’s Unbreakable",
          "Jawline That’s Peak Bro", "Jawline That’s Absolute Fire", "Jawline That’s Legendary",
          "Jawline That’s Giving Power", "Jawline That’s No Cap Goals", "Jawline That’s 100% Drip",
          "Jawline That’s TikTok Famous", "Jawline That’s Built Different", "Jawline That’s a Total Slap",
          "Jawline That’s Top Shelf", "Jawline That’s Vibe King"
        ],
        low: [
          "Jawline Taking a Day Off", "Jawline That’s Lowkey Soft", "Jawline That’s Not Trying",
          "Jawline That’s Built Chill", "Jawline That’s Just There", "Jawline That’s Kinda Mid",
          "Jawline That’s Not Popping", "Jawline That’s Caught Slipping", "Jawline That’s a L",
          "Jawline That’s Vibe Check Failed", "Jawline That’s Down Bad", "Jawline That’s Oof",
          "Jawline That’s NPC Status", "Jawline That’s Sus AF", "Jawline That’s Nope",
          "Jawline That’s Low Effort", "Jawline That’s Facecard Denied", "Jawline That’s Barely Vibing",
          "Jawline That’s Meh Bro", "Jawline That’s Big Yikes"
        ]
      },
      W: {
        high: [
          "Jawline That Could Grace a Magazine", "Jawline That’s Baddie Goals", "Jawline That’s Too Pretty",
          "Jawline That’s Serving Face", "Jawline That’s Queen Energy", "Jawline That’s Elegant Slay",
          "Jawline That’s Facecard Valid", "Jawline That’s Straight Fire", "Jawline That’s Popping Off",
          "Jawline That’s 10/10 No Filter", "Jawline That’s Giving Life", "Jawline That’s Iconic",
          "Jawline That’s She Ate That", "Jawline That’s Absolute Glow", "Jawline That’s Built Different",
          "Jawline That’s Vibe Queen", "Jawline That’s No Cap Slay", "Jawline That’s TikTok Ready",
          "Jawline That’s Top Tier", "Jawline That’s 100% Glow"
        ],
        low: [
          "Jawline That’s Soft and Sweet", "Jawline That’s Lowkey Hiding", "Jawline That’s Not Serving",
          "Jawline That’s Built Chill", "Jawline That’s Just Vibing", "Jawline That’s Kinda Mid",
          "Jawline That’s Not Popping", "Jawline That’s Caught Lacking", "Jawline That’s a L",
          "Jawline That’s Vibe Check Bounced", "Jawline That’s Down Bad", "Jawline That’s Oof",
          "Jawline That’s NPC Energy", "Jawline That’s Sus Vibes", "Jawline That’s Nope",
          "Jawline That’s Low Effort", "Jawline That’s Facecard Declined", "Jawline That’s Barely There",
          "Jawline That’s Meh Sis", "Jawline That’s Big Yikes"
        ]
      }
    },
    'Nose': {
      high: [
        "Nose So Perfect It’s Sus", "Nose That’s TikTok Famous", "Nose That’s Built Elite",
        "Nose That’s Too Clean", "Nose That’s Facecard Approved", "Nose That’s 10/10 No Cap",
        "Nose That’s Absolute Slay", "Nose That’s Vibe Check Passed", "Nose That’s Golden Ratio",
        "Nose That’s Straight Fire", "Nose That’s Unreal", "Nose That’s Serving Looks",
        "Nose That’s Top Tier", "Nose That’s Flawless", "Nose That’s Giving Energy",
        "Nose That’s No Filter Needed", "Nose That’s Legendary", "Nose That’s Built Different",
        "Nose That’s Slap City", "Nose That’s Perfection"
      ],
      low: [
        "Nose With Its Own Plot Twist", "Nose That’s Lowkey Sus", "Nose That’s Built Weird",
        "Nose That’s Not Quite Right", "Nose That’s Mid Energy", "Nose That’s a Bit Oof",
        "Nose That’s Caught Lacking", "Nose That’s Vibe Check Failed", "Nose That’s Down Bad",
        "Nose That’s Nope AF", "Nose That’s Facecard Denied", "Nose That’s a Meme Moment",
        "Nose That’s Big Yikes", "Nose That’s Quirky", "Nose That’s Low Battery",
        "Nose That’s Bruh Mode", "Nose That’s Not It", "Nose That’s a Hard Pass",
        "Nose That’s Weird Flex", "Nose That’s Extra"
      ]
    },
    'Height': {
      M: {
        high: [
          "Towering Titan", "Sky-High Stud", "Lofty Legend", "Vertical Virtuoso",
          "Height That Hits Different", "Reaching Chad Levels", "Tall King Energy",
          "Above the Rim Bro", "Height That Slaps", "Stature of a God"
        ],
        low: [
          "Compact King", "Fun-Sized Fellow", "Vertically Challenged", "Low to the Ground",
          "Short Stack Vibes", "Pocket-Sized Bro", "Height That’s a Meme",
          "Ground-Level Gang", "Mini Man Energy", "Small But Mighty"
        ]
      },
      W: {
        high: [
          "Statuesque Stunner", "Runway Ready", "Lofty Lady", "Towering Beauty",
          "Height That Serves", "Amazonian Queen", "Tall Girl Energy",
          "Above Average Elegance", "Height That Slays", "Goddess Stature"
        ],
        low: [
          "Petite Princess", "Pocket-Sized Beauty", "Mini Muse", "Fun-Sized Queen",
          "Short Queen Vibes", "Tiny But Fierce", "Height That’s a TikTok",
          "Small Frame Slay", "Dainty Diva", "Little Legend"
        ]
      }
    },
    'Weight': {
      M: {
        high: [
          "Built Like a Tank", "Sculpted Like a Statue", "Prime Physique", "Absolute Unit",
          "Ripped Chad Energy", "Solid as a Rock", "Muscle Man Vibes",
          "Weight That’s GOATed", "Built Different Bro", "Peak Form King"
        ],
        low: [
          "Dad Bod Vibes", "Bulking Season", "Unique Build", "Meme Material",
          "Soft Serve Energy", "Chill Frame Bro", "Weight That’s a Mood",
          "Average Build Gang", "Built Like a TikTok", "Quirky Physique"
        ]
      },
      W: {
        high: [
          "Built Like a Model", "Sculpted Elegance", "Prime Silhouette", "Absolute Queen",
          "Fit Baddie Energy", "Solid Glow Sis", "Body That Serves",
          "Weight That’s Iconic", "Built Different Babe", "Peak Form Queen"
        ],
        low: [
          "Curvy Queen", "Thick Thighs Save Lives", "Unique Silhouette", "TikTok Build",
          "Soft Glow Vibes", "Chill Frame Sis", "Weight That’s a Vibe",
          "Average Build Energy", "Built Like a Meme", "Quirky Curves"
        ]
      }
    }
  };
  
  // Get random element from array
  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };
  
  // Get descriptor based on score
  const getScoreDescriptor = (score) => {
    if (score >= SCORE_RANGES.EXCEPTIONAL) return 'EXCEPTIONAL';
    if (score >= SCORE_RANGES.ABOVE_AVERAGE) return 'ABOVE_AVERAGE';
    if (score >= SCORE_RANGES.AVERAGE) return 'AVERAGE';
    return 'BELOW_AVERAGE';
  };
  
  // Main function to generate rating name, updated to include physical attributes
  export const generateRatingName = (allScores, gender) => {
    // Calculate average score for facial features only for overall descriptor
    const facialScores = Object.fromEntries(
      Object.entries(allScores).filter(([key]) => !['Height', 'Weight'].includes(key))
    );
    const averageScore = Object.values(facialScores).reduce((a, b) => a + b, 0) / Object.keys(facialScores).length;
    const overallRating = getScoreDescriptor(averageScore);
    const overallDescriptors = CASUAL_OVERALL_DESCRIPTORS[gender];
    const overallDescriptor = getRandomElement(overallDescriptors[overallRating]);
  
    // Find the feature (facial or physical) with score farthest from 50
    const featureToDescribe = Object.entries(allScores).reduce((a, b) => {
      const aDiff = Math.abs(a[1] - 50);
      const bDiff = Math.abs(b[1] - 50);
      return aDiff > bDiff ? a : b;
    })[0];
    const featureScore = allScores[featureToDescribe];
    const isHighScore = featureScore >= 50;
  
    // Get feature phrase
    const featurePhrases = FEATURE_PHRASES[featureToDescribe];
    let phrases;
    if (featurePhrases.M && featurePhrases.W) {
      phrases = featurePhrases[gender];
    } else {
      phrases = featurePhrases;
    }
    const phraseKey = isHighScore ? 'high' : 'low';
    const featurePhrase = getRandomElement(phrases[phraseKey]);
  
    // Combine into a name
    return `${overallDescriptor} with ${featurePhrase}`;
  };