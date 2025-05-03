export const crimeFinder = {
  violent: {
    name: 'Violent Crimes',
    color: '#ff4757',
    description: 'Crimes involving physical harm or threat of harm',
    crimes: [
      {
        name: 'First Degree Murder',
        description: 'Premeditated killing with malice aforethought',
        jailTerm: '25 years to life',
        severity: 'Extreme',
        examples: ['Richard Ramirez', 'Anders Breivik']
      },
      {
        name: 'Second Degree Murder',
        description: 'Intentional killing without premeditation',
        jailTerm: '15-25 years',
        severity: 'High',
        examples: ['Charles Manson', 'Timothy McVeigh']
      },
      {
        name: 'Manslaughter',
        description: 'Unintentional killing due to reckless behavior',
        jailTerm: '5-15 years',
        severity: 'Moderate-High',
        examples: []
      },
      {
        name: 'Aggravated Assault',
        description: 'Serious physical attack with intent to cause harm',
        jailTerm: '2-10 years',
        severity: 'Moderate',
        examples: []
      },
      {
        name: 'Terrorism',
        description: 'Violent acts intended to create fear for political purposes',
        jailTerm: '20 years to life',
        severity: 'Extreme',
        examples: ['Timothy McVeigh']
      }
    ]
  },
  sexual: {
    name: 'Sexual Crimes',
    color: '#ff6b6b',
    description: 'Crimes involving sexual misconduct or abuse',
    crimes: [
      {
        name: 'Rape',
        description: 'Non-consensual sexual intercourse',
        jailTerm: '5-20 years',
        severity: 'High',
        examples: ['Ted Bundy', 'Paul Bernardo']
      },
      {
        name: 'Sexual Assault',
        description: 'Unwanted sexual contact or behavior',
        jailTerm: '2-10 years',
        severity: 'Moderate-High',
        examples: ['Jeffrey Dahmer']
      },
      {
        name: 'Child Sexual Abuse',
        description: 'Sexual exploitation of minors',
        jailTerm: '10-30 years',
        severity: 'Extreme',
        examples: []
      },
      {
        name: 'Sexual Harassment',
        description: 'Unwelcome sexual advances or behavior',
        jailTerm: 'Up to 1 year',
        severity: 'Moderate',
        examples: []
      },
      {
        name: 'Sexual Exploitation',
        description: 'Taking advantage of others for sexual purposes',
        jailTerm: '3-15 years',
        severity: 'High',
        examples: ['Luka Magnotta']
      }
    ]
  },
  whiteCollar: {
    name: 'White Collar Crimes',
    color: '#2ed573',
    description: 'Non-violent crimes committed for financial gain',
    crimes: [
      {
        name: 'Fraud',
        description: 'Intentional deception for financial gain',
        jailTerm: '1-10 years',
        severity: 'Moderate',
        examples: ['Bernie Madoff', 'Elizabeth Holmes']
      },
      {
        name: 'Embezzlement',
        description: 'Theft of funds by someone in a position of trust',
        jailTerm: '1-15 years',
        severity: 'Moderate-High',
        examples: ['Jordan Belfort']
      },
      {
        name: 'Insider Trading',
        description: 'Trading based on non-public information',
        jailTerm: 'Up to 20 years',
        severity: 'High',
        examples: ['Martin Shkreli']
      },
      {
        name: 'Money Laundering',
        description: 'Concealing the origins of illegally obtained money',
        jailTerm: '5-20 years',
        severity: 'High',
        examples: ['Charles Ponzi']
      },
      {
        name: 'Corporate Fraud',
        description: 'Deceptive practices by corporations',
        jailTerm: '1-25 years',
        severity: 'Moderate-High',
        examples: ['Elizabeth Holmes']
      }
    ]
  }
};

// Helper function to get crimes based on category and score
export const getCrimePredictions = (category, score) => {
  const crimes = crimeFinder[category]?.crimes || [];
  const predictions = [];

  // Determine severity threshold based on score
  let severityThreshold;
  if (score >= 80) {
    severityThreshold = 'Extreme';
  } else if (score >= 60) {
    severityThreshold = 'High';
  } else if (score >= 40) {
    severityThreshold = 'Moderate-High';
  } else {
    severityThreshold = 'Moderate';
  }

  // Filter and sort crimes by severity
  crimes.forEach(crime => {
    if (crime.severity === severityThreshold || 
        (severityThreshold === 'Extreme' && crime.severity === 'High') ||
        (severityThreshold === 'High' && crime.severity === 'Moderate-High')) {
      predictions.push({
        ...crime,
        likelihood: calculateLikelihood(score, crime.severity)
      });
    }
  });

  return predictions.sort((a, b) => b.likelihood - a.likelihood);
};

// Helper function to calculate likelihood percentage
const calculateLikelihood = (score, severity) => {
  const baseLikelihood = score;
  let severityMultiplier = 1;

  switch (severity) {
    case 'Extreme':
      severityMultiplier = 1.2;
      break;
    case 'High':
      severityMultiplier = 1.1;
      break;
    case 'Moderate-High':
      severityMultiplier = 1.05;
      break;
    default:
      severityMultiplier = 1;
  }

  return Math.min(Math.round(baseLikelihood * severityMultiplier), 100);
};

// Helper function to get crime examples
export const getCrimeExamples = (category) => {
  const crimes = crimeFinder[category]?.crimes || [];
  const examples = new Set();

  crimes.forEach(crime => {
    crime.examples.forEach(example => {
      if (example) examples.add(example);
    });
  });

  return Array.from(examples);
}; 