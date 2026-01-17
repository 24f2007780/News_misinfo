const Cluster = require('../models/Cluster');
const Claim = require('../models/Claim');

const sampleClusters = [
  {
    name: "COVID-19 Vaccine Misinformation",
    description: "False claims about COVID-19 vaccines causing various health issues and containing harmful substances",
    category: "health",
    riskLevel: "critical",
    status: "active",
    keywords: ["vaccine", "covid", "mrna", "side effects", "microchip", "dna"],
    geographicDistribution: [
      { country: "United States", region: "North America", count: 245 },
      { country: "India", region: "Asia", count: 189 },
      { country: "Brazil", region: "South America", count: 156 },
      { country: "United Kingdom", region: "Europe", count: 134 },
      { country: "Germany", region: "Europe", count: 98 }
    ],
    metrics: {
      totalClaims: 822,
      verifiedClaims: 687,
      falseClaims: 623,
      averageConfidence: 0.89,
      reach: 2450000,
      engagement: 890000
    },
    timeline: [
      { date: "2024-01-01", count: 45 },
      { date: "2024-01-02", count: 52 },
      { date: "2024-01-03", count: 38 },
      { date: "2024-01-04", count: 67 },
      { date: "2024-01-05", count: 73 },
      { date: "2024-01-06", count: 41 },
      { date: "2024-01-07", count: 56 }
    ]
  },
  {
    name: "Climate Change Denial",
    description: "Claims denying human impact on climate change and questioning scientific consensus",
    category: "climate",
    riskLevel: "high",
    status: "active",
    keywords: ["climate", "global warming", "hoax", "natural cycles", "co2"],
    geographicDistribution: [
      { country: "United States", region: "North America", count: 198 },
      { country: "Australia", region: "Oceania", count: 87 },
      { country: "Canada", region: "North America", count: 76 },
      { country: "Russia", region: "Europe", count: 65 },
      { country: "Saudi Arabia", region: "Asia", count: 43 }
    ],
    metrics: {
      totalClaims: 469,
      verifiedClaims: 398,
      falseClaims: 356,
      averageConfidence: 0.92,
      reach: 1230000,
      engagement: 456000
    },
    timeline: [
      { date: "2024-01-01", count: 23 },
      { date: "2024-01-02", count: 31 },
      { date: "2024-01-03", count: 28 },
      { date: "2024-01-04", count: 42 },
      { date: "2024-01-05", count: 35 },
      { date: "2024-01-06", count: 29 },
      { date: "2024-01-07", count: 38 }
    ]
  },
  {
    name: "Election Fraud Allegations",
    description: "Unsubstantiated claims about voting machine manipulation and ballot fraud",
    category: "politics",
    riskLevel: "critical",
    status: "active",
    keywords: ["election", "fraud", "voting machines", "ballot", "rigged"],
    geographicDistribution: [
      { country: "United States", region: "North America", count: 312 },
      { country: "Brazil", region: "South America", count: 89 },
      { country: "India", region: "Asia", count: 67 },
      { country: "Philippines", region: "Asia", count: 45 },
      { country: "Mexico", region: "North America", count: 34 }
    ],
    metrics: {
      totalClaims: 547,
      verifiedClaims: 489,
      falseClaims: 467,
      averageConfidence: 0.87,
      reach: 1890000,
      engagement: 723000
    },
    timeline: [
      { date: "2024-01-01", count: 34 },
      { date: "2024-01-02", count: 45 },
      { date: "2024-01-03", count: 52 },
      { date: "2024-01-04", count: 38 },
      { date: "2024-01-05", count: 41 },
      { date: "2024-01-06", count: 47 },
      { date: "2024-01-07", count: 39 }
    ]
  },
  {
    name: "5G Health Conspiracy",
    description: "False claims linking 5G technology to various health problems and COVID-19",
    category: "technology",
    riskLevel: "high",
    status: "active",
    keywords: ["5g", "radiation", "cancer", "covid", "towers", "electromagnetic"],
    geographicDistribution: [
      { country: "United Kingdom", region: "Europe", count: 123 },
      { country: "United States", region: "North America", count: 98 },
      { country: "Germany", region: "Europe", count: 76 },
      { country: "France", region: "Europe", count: 54 },
      { country: "Netherlands", region: "Europe", count: 43 }
    ],
    metrics: {
      totalClaims: 394,
      verifiedClaims: 342,
      falseClaims: 321,
      averageConfidence: 0.91,
      reach: 890000,
      engagement: 234000
    },
    timeline: [
      { date: "2024-01-01", count: 18 },
      { date: "2024-01-02", count: 25 },
      { date: "2024-01-03", count: 32 },
      { date: "2024-01-04", count: 29 },
      { date: "2024-01-05", count: 22 },
      { date: "2024-01-06", count: 31 },
      { date: "2024-01-07", count: 27 }
    ]
  },
  {
    name: "Cryptocurrency Scams",
    description: "Fraudulent investment schemes and fake celebrity endorsements in cryptocurrency",
    category: "economy",
    riskLevel: "high",
    status: "active",
    keywords: ["bitcoin", "crypto", "investment", "scam", "celebrity", "endorsement"],
    geographicDistribution: [
      { country: "Nigeria", region: "Africa", count: 145 },
      { country: "India", region: "Asia", count: 134 },
      { country: "United States", region: "North America", count: 98 },
      { country: "United Kingdom", region: "Europe", count: 76 },
      { country: "South Africa", region: "Africa", count: 65 }
    ],
    metrics: {
      totalClaims: 518,
      verifiedClaims: 467,
      falseClaims: 445,
      averageConfidence: 0.85,
      reach: 1340000,
      engagement: 567000
    },
    timeline: [
      { date: "2024-01-01", count: 28 },
      { date: "2024-01-02", count: 35 },
      { date: "2024-01-03", count: 42 },
      { date: "2024-01-04", count: 31 },
      { date: "2024-01-05", count: 38 },
      { date: "2024-01-06", count: 33 },
      { date: "2024-01-07", count: 29 }
    ]
  },
  {
    name: "Miracle Cure Claims",
    description: "Unproven medical treatments and supplements claiming to cure serious diseases",
    category: "health",
    riskLevel: "critical",
    status: "active",
    keywords: ["cure", "miracle", "supplement", "cancer", "diabetes", "natural"],
    geographicDistribution: [
      { country: "India", region: "Asia", count: 167 },
      { country: "United States", region: "North America", count: 123 },
      { country: "Brazil", region: "South America", count: 89 },
      { country: "Mexico", region: "North America", count: 67 },
      { country: "Philippines", region: "Asia", count: 54 }
    ],
    metrics: {
      totalClaims: 500,
      verifiedClaims: 445,
      falseClaims: 423,
      averageConfidence: 0.88,
      reach: 1120000,
      engagement: 445000
    },
    timeline: [
      { date: "2024-01-01", count: 32 },
      { date: "2024-01-02", count: 28 },
      { date: "2024-01-03", count: 35 },
      { date: "2024-01-04", count: 41 },
      { date: "2024-01-05", count: 29 },
      { date: "2024-01-06", count: 37 },
      { date: "2024-01-07", count: 33 }
    ]
  },
  {
    name: "Celebrity Death Hoaxes",
    description: "False reports of celebrity deaths spreading across social media platforms",
    category: "other",
    riskLevel: "medium",
    status: "active",
    keywords: ["celebrity", "death", "hoax", "died", "rip", "fake news"],
    geographicDistribution: [
      { country: "United States", region: "North America", count: 89 },
      { country: "India", region: "Asia", count: 76 },
      { country: "Brazil", region: "South America", count: 54 },
      { country: "United Kingdom", region: "Europe", count: 43 },
      { country: "Canada", region: "North America", count: 32 }
    ],
    metrics: {
      totalClaims: 294,
      verifiedClaims: 267,
      falseClaims: 289,
      averageConfidence: 0.94,
      reach: 567000,
      engagement: 234000
    },
    timeline: [
      { date: "2024-01-01", count: 15 },
      { date: "2024-01-02", count: 22 },
      { date: "2024-01-03", count: 18 },
      { date: "2024-01-04", count: 26 },
      { date: "2024-01-05", count: 19 },
      { date: "2024-01-06", count: 21 },
      { date: "2024-01-07", count: 17 }
    ]
  }
];

const sampleClaims = [
  // COVID-19 Vaccine Claims
  {
    text: "COVID-19 vaccines contain microchips for government tracking",
    originalText: "COVID-19 vaccines contain microchips for government tracking",
    category: "health",
    language: "en",
    verdict: "false",
    confidence: 0.95,
    verificationStatus: "verified",
    explanation: {
      short: "No evidence supports the claim that COVID-19 vaccines contain microchips.",
      medium: "Multiple fact-checking organizations and health authorities have confirmed that COVID-19 vaccines do not contain microchips or tracking devices.",
      long: "This claim has been thoroughly debunked by medical experts, fact-checkers, and health organizations worldwide. The ingredients of COVID-19 vaccines are publicly available and do not include any electronic devices.",
      eli5: "The vaccines don't have computer chips in them. That's not true and doctors have checked."
    },
    source: { platform: "social_media", type: "user-submission" }
  },
  {
    text: "mRNA vaccines alter human DNA permanently",
    originalText: "mRNA vaccines alter human DNA permanently",
    category: "health",
    language: "en",
    verdict: "false",
    confidence: 0.92,
    verificationStatus: "verified",
    explanation: {
      short: "mRNA vaccines do not alter human DNA.",
      medium: "mRNA vaccines work by instructing cells to produce a protein that triggers an immune response. They do not enter the cell nucleus where DNA is stored.",
      long: "Scientific evidence shows that mRNA vaccines cannot alter human DNA. The mRNA never enters the cell nucleus and is quickly broken down by the cell after producing the target protein.",
      eli5: "These vaccines don't change your DNA. They just teach your body how to fight the virus."
    },
    source: { platform: "social_media", type: "user-submission" }
  },
  // Climate Change Claims
  {
    text: "Climate change is a natural cycle, not caused by humans",
    originalText: "Climate change is a natural cycle, not caused by humans",
    category: "climate",
    language: "en",
    verdict: "false",
    confidence: 0.96,
    verificationStatus: "verified",
    explanation: {
      short: "Scientific consensus confirms human activities are the primary cause of current climate change.",
      medium: "Over 97% of climate scientists agree that current climate change is primarily caused by human activities, particularly greenhouse gas emissions.",
      long: "Multiple lines of evidence, including temperature records, ice core data, and atmospheric measurements, demonstrate that current climate change is primarily driven by human activities rather than natural cycles.",
      eli5: "Scientists have studied this a lot and found that people are causing climate change, not nature alone."
    },
    source: { platform: "social_media", type: "user-submission" }
  },
  // Election Claims
  {
    text: "Voting machines were hacked to change election results",
    originalText: "Voting machines were hacked to change election results",
    category: "politics",
    language: "en",
    verdict: "false",
    confidence: 0.89,
    verificationStatus: "verified",
    explanation: {
      short: "No credible evidence supports claims of widespread voting machine hacking.",
      medium: "Election security experts and multiple audits have found no evidence of voting machine hacking that would change election outcomes.",
      long: "Extensive investigations, audits, and court cases have found no credible evidence of voting machine hacking or manipulation that would affect election results.",
      eli5: "The voting machines worked correctly and weren't hacked to change votes."
    },
    source: { platform: "social_media", type: "user-submission" }
  },
  // 5G Claims
  {
    text: "5G towers cause COVID-19 and weaken immune systems",
    originalText: "5G towers cause COVID-19 and weaken immune systems",
    category: "technology",
    language: "en",
    verdict: "false",
    confidence: 0.94,
    verificationStatus: "verified",
    explanation: {
      short: "5G technology does not cause COVID-19 or weaken immune systems.",
      medium: "COVID-19 is caused by a virus, not radio waves. 5G operates at frequencies that are non-ionizing and do not harm human health.",
      long: "Scientific evidence shows no link between 5G technology and COVID-19. The virus has spread in areas without 5G coverage, and radio frequencies used by 5G are well within safety limits.",
      eli5: "5G towers don't make people sick or cause COVID-19. The virus comes from germs, not phone towers."
    },
    source: { platform: "social_media", type: "user-submission" }
  }
];

async function seedClusters() {
  try {
    console.log('🌱 Seeding misinformation clusters...');
    
    // Clear existing clusters
    await Cluster.deleteMany({});
    console.log('🗑️ Cleared existing clusters');
    
    // Create clusters
    const createdClusters = await Cluster.insertMany(sampleClusters);
    console.log(`✅ Created ${createdClusters.length} clusters`);
    
    // Create sample claims and associate with clusters
    console.log('🌱 Seeding sample claims...');
    
    const claimsWithClusters = sampleClaims.map((claim, index) => ({
      ...claim,
      clusterId: createdClusters[Math.floor(index / 2)]._id, // Associate 2 claims per cluster
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
      metrics: {
        views: Math.floor(Math.random() * 1000) + 100,
        shares: Math.floor(Math.random() * 200) + 20,
        reports: Math.floor(Math.random() * 50),
        reach: Math.floor(Math.random() * 10000) + 1000
      },
      flags: {
        viral: Math.random() > 0.7,
        urgent: Math.random() > 0.8,
        sensitive: Math.random() > 0.6
      }
    }));
    
    const existingClaimsCount = await Claim.countDocuments();
    if (existingClaimsCount < 10) {
      await Claim.insertMany(claimsWithClusters);
      console.log(`✅ Created ${claimsWithClusters.length} sample claims`);
    } else {
      console.log('📊 Claims already exist, skipping claim seeding');
    }
    
    // Update cluster references
    for (let i = 0; i < createdClusters.length; i++) {
      const clusterClaims = await Claim.find({ clusterId: createdClusters[i]._id });
      createdClusters[i].claims = clusterClaims.map(c => c._id);
      await createdClusters[i].save();
    }
    
    console.log('✅ Cluster and claim seeding completed successfully!');
    console.log(`📊 Total clusters: ${createdClusters.length}`);
    console.log(`📊 Total claims: ${await Claim.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error seeding clusters:', error);
  }
}

module.exports = seedClusters;
