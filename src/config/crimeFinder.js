export const crimeFinder = {
  violent: {
    name: 'Violent Crimes',
    color: '#ff4757',
    description: 'Crimes involving physical harm or threat of harm',
    crimes: {
      male: {
        dark: [
          {
            name: 'Gang-Related Murder',
            description: 'Street gang execution style killings',
            jailTerm: 'Life without parole',
            severity: 'Extreme',
            examples: []
          },
          {
            name: 'Drive-By Shooting',
            description: 'Vehicle-based gang violence',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: []
          },
          {
            name: 'Street Gang Leadership',
            description: 'Directing organized gang violence',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Cartel Execution',
            description: 'Drug cartel related killings',
            jailTerm: 'Life without parole',
            severity: 'Extreme',
            examples: ['El Chapo']
          },
          {
            name: 'Cartel Torture',
            description: 'Organized crime interrogation',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: []
          },
          {
            name: 'Drug Territory Violence',
            description: 'Cartel territory disputes',
            jailTerm: '20-30 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Mass Shooting',
            description: 'Large-scale public violence',
            jailTerm: 'Life without parole',
            severity: 'Extreme',
            examples: ['Anders Breivik']
          },
          {
            name: 'Hate Crime Leadership',
            description: 'Organizing targeted group violence',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: []
          },
          {
            name: 'Militia Violence',
            description: 'Paramilitary group operations',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ]
      },
      female: {
        dark: [
          {
            name: 'Gang Queen Violence',
            description: 'Female gang leader operations',
            jailTerm: '20-30 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Street Crew Management',
            description: 'Organizing street level operations',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Cartel Intelligence',
            description: 'Drug cartel information operations',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Sicaria Operations',
            description: 'Female cartel assassin work',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: []
          }
        ],
        light: [
          {
            name: 'Extremist Recruitment',
            description: 'Organizing extremist groups',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Poison Ring',
            description: 'Organized poisoning operations',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: []
          }
        ]
      }
    }
  },
  sexual: {
    name: 'Sexual Crimes',
    color: '#ff6b6b',
    description: 'Crimes involving sexual misconduct or exploitation',
    crimes: {
      male: {
        dark: [
          {
            name: 'Street Trafficking',
            description: 'Urban prostitution rings',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Gang Exploitation',
            description: 'Gang-based sexual crimes',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Border Trafficking',
            description: 'Cross-border exploitation',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: []
          },
          {
            name: 'Massage Parlor Network',
            description: 'Organized brothel operations',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Elite Trafficking Ring',
            description: 'High-society exploitation network',
            jailTerm: 'Life without parole',
            severity: 'Extreme',
            examples: ['Jeffrey Epstein']
          },
          {
            name: 'Private Island Operation',
            description: 'Exclusive exploitation venue',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: []
          }
        ]
      },
      female: {
        dark: [
          {
            name: 'Street Network Management',
            description: 'Urban exploitation organization',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Spa Trafficking Ring',
            description: 'Massage parlor trafficking',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Elite Recruitment',
            description: 'High-society trafficking recruitment',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: ['Ghislaine Maxwell']
          }
        ]
      }
    }
  },
  whiteCollar: {
    name: 'White Collar Crimes',
    color: '#2ed573',
    description: 'Sophisticated financial and business crimes',
    crimes: {
      male: {
        dark: [
          {
            name: 'Sports Gambling Ring',
            description: 'Illegal betting operation',
            jailTerm: '5-15 years',
            severity: 'Moderate-High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Real Estate Fraud',
            description: 'Property investment scams',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Wall Street Fraud',
            description: 'Major financial market manipulation',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: ['Bernie Madoff']
          },
          {
            name: 'Corporate Embezzlement',
            description: 'Large-scale company theft',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ]
      },
      female: {
        dark: [
          {
            name: 'Benefits Fraud Ring',
            description: 'Government assistance scams',
            jailTerm: '5-15 years',
            severity: 'Moderate-High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Insurance Fraud Network',
            description: 'Systematic insurance scams',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Medical Startup Fraud',
            description: 'Healthcare technology scams',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: ['Elizabeth Holmes']
          }
        ]
      }
    }
  },
  organized: {
    name: 'Organized Crime',
    color: '#ffa502',
    description: 'Sophisticated criminal enterprise operations',
    crimes: {
      male: {
        dark: [
          {
            name: 'Street Gang Enterprise',
            description: 'Urban criminal organization',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Drug Distribution Network',
            description: 'Street level narcotics operation',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Cartel Leadership',
            description: 'Drug cartel command structure',
            jailTerm: 'Life without parole',
            severity: 'Extreme',
            examples: ['El Chapo']
          },
          {
            name: 'International Drug Trade',
            description: 'Global narcotics operation',
            jailTerm: '25 years to life',
            severity: 'Extreme',
            examples: []
          }
        ],
        light: [
          {
            name: 'Cybercrime Syndicate',
            description: 'Advanced digital crime network',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          },
          {
            name: 'Dark Web Operation',
            description: 'Underground digital marketplace',
            jailTerm: '20-30 years',
            severity: 'Extreme',
            examples: []
          }
        ]
      },
      female: {
        dark: [
          {
            name: 'Street Network Control',
            description: 'Urban crime organization',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ],
        medium: [
          {
            name: 'Cartel Intelligence',
            description: 'Drug cartel operations',
            jailTerm: '15-25 years',
            severity: 'High',
            examples: []
          }
        ],
        light: [
          {
            name: 'Cyber Fraud Ring',
            description: 'Digital crime enterprise',
            jailTerm: '10-20 years',
            severity: 'High',
            examples: []
          }
        ]
      }
    }
  }
}; 