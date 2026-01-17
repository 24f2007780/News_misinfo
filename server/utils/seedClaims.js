const Claim = require('../models/Claim');

const sampleClaims = [
  {
    text: "Vaccines cause autism",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.95,
    category: "health",
    explanation: {
      short: "Multiple large-scale studies have found no link between vaccines and autism.",
      medium: "Extensive research involving millions of children has consistently shown no causal relationship between vaccines and autism. The original study claiming this link was retracted due to fraudulent data.",
      long: "The claim that vaccines cause autism originated from a 1998 study by Andrew Wakefield, which was later retracted due to serious procedural errors, undisclosed financial conflicts of interest, and ethical violations. Since then, numerous large-scale studies involving millions of children worldwide have found no evidence of a link between vaccines and autism. The scientific consensus strongly supports vaccine safety.",
      eli5: "Scientists have checked millions of kids and found that vaccines don't cause autism. The person who said they did was lying and lost his doctor license."
    },
    evidence: [
      {
        source: "CDC",
        title: "Vaccines Do Not Cause Autism",
        snippet: "Vaccine ingredients do not cause autism. Studies have shown that there is no link between vaccines and autism.",
        url: "https://www.cdc.gov/vaccinesafety/concerns/autism.html"
      }
    ],
    language: "en",
    urgency: "high"
  },
  {
    text: "Climate change is a hoax",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.98,
    category: "climate",
    explanation: {
      short: "Climate change is supported by overwhelming scientific evidence from multiple independent sources.",
      medium: "97% of climate scientists agree that climate change is real and caused by human activities. Evidence includes rising global temperatures, melting ice caps, and increasing extreme weather events.",
      long: "Climate change is one of the most well-documented scientific phenomena. Multiple lines of evidence from ice cores, tree rings, ocean temperatures, and atmospheric measurements all confirm that Earth's climate is warming rapidly due to human greenhouse gas emissions.",
      eli5: "Almost all scientists who study weather agree that Earth is getting warmer because of pollution from cars and factories."
    },
    evidence: [
      {
        source: "NASA",
        title: "Scientific Consensus on Climate Change",
        snippet: "Multiple studies show that 97% or more of actively publishing climate scientists agree that climate-warming trends are extremely likely due to human activities.",
        url: "https://climate.nasa.gov/scientific-consensus/"
      }
    ],
    language: "en",
    urgency: "critical"
  },
  {
    text: "The Earth is flat",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.99,
    category: "science",
    explanation: {
      short: "The Earth is a sphere, proven by countless observations and experiments over centuries.",
      medium: "Evidence for Earth's spherical shape includes satellite imagery, the way ships disappear over the horizon, different star constellations in different hemispheres, and the physics of gravity.",
      long: "The spherical nature of Earth has been known since ancient times and confirmed by modern science. Evidence includes photographs from space, the behavior of gravity, time zones, the Coriolis effect, and the ability to circumnavigate the globe.",
      eli5: "We can see Earth is round from space photos, and when you sail far enough, you come back to where you started - just like going around a ball."
    },
    evidence: [
      {
        source: "NASA",
        title: "Earth is Round",
        snippet: "Satellite images clearly show Earth as a sphere. The planet's shape is an oblate spheroid.",
        url: "https://www.nasa.gov/audience/forstudents/5-8/features/nasa-knows/what-is-earth-58.html"
      }
    ],
    language: "en",
    urgency: "low"
  },
  {
    text: "5G networks cause COVID-19",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.97,
    category: "health",
    explanation: {
      short: "COVID-19 is caused by a virus, not radio waves. 5G technology cannot transmit viruses.",
      medium: "COVID-19 is caused by the SARS-CoV-2 virus and spreads through respiratory droplets. Radio waves from 5G networks cannot carry viruses, and countries without 5G also experienced COVID-19 outbreaks.",
      long: "This conspiracy theory has no scientific basis. Viruses cannot travel on radio waves or mobile networks. COVID-19 spread in countries with no 5G coverage, and the virus was identified as SARS-CoV-2 through genetic sequencing.",
      eli5: "COVID is a tiny germ that makes people sick. Phone towers send invisible signals for phones, but they can't carry germs."
    },
    evidence: [
      {
        source: "WHO",
        title: "5G mobile networks DO NOT spread COVID-19",
        snippet: "Viruses cannot travel on radio waves/mobile networks. COVID-19 is spreading in many countries that do not have 5G mobile networks.",
        url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters"
      }
    ],
    language: "en",
    urgency: "high"
  },
  {
    text: "Drinking water cures all diseases",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.92,
    category: "health",
    explanation: {
      short: "While hydration is important for health, water alone cannot cure diseases.",
      medium: "Water is essential for bodily functions and can help prevent dehydration-related issues, but it cannot cure infections, cancer, or other diseases that require medical treatment.",
      long: "Proper hydration supports overall health and helps the body function optimally, but water is not a cure-all. Diseases require appropriate medical treatment, and relying solely on water can be dangerous.",
      eli5: "Water is good for you and keeps you healthy, but if you're really sick, you need medicine from a doctor, not just water."
    },
    evidence: [
      {
        source: "Mayo Clinic",
        title: "Water: How much should you drink every day?",
        snippet: "Water is essential for health, but it's not a cure for diseases. Medical conditions require proper medical treatment.",
        url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256"
      }
    ],
    language: "en",
    urgency: "medium"
  },
  {
    text: "The moon landing was faked",
    verdict: "false",
    verificationStatus: "verified",
    confidence: 0.96,
    category: "science",
    explanation: {
      short: "The Apollo moon landings were real, supported by extensive evidence and verified by multiple countries.",
      medium: "Evidence for the moon landings includes moon rocks brought back to Earth, retroreflectors left on the moon's surface, independent tracking by other countries, and thousands of photos and videos.",
      long: "The Apollo program successfully landed humans on the moon six times between 1969-1972. Evidence includes 382 kg of moon rocks, retroreflectors still used today, independent verification by Soviet Union tracking stations, and testimony from thousands of NASA employees and contractors.",
      eli5: "Astronauts really did go to the moon! They brought back special rocks and left mirrors there that scientists still use today."
    },
    evidence: [
      {
        source: "NASA",
        title: "Apollo Moon Landing",
        snippet: "The Apollo missions successfully landed 12 astronauts on the Moon between 1969 and 1972.",
        url: "https://www.nasa.gov/mission_pages/apollo/missions/index.html"
      }
    ],
    language: "en",
    urgency: "low"
  }
];

async function seedClaims() {
  try {
    // Check if claims already exist
    const existingCount = await Claim.countDocuments();
    
    if (existingCount > 0) {
      console.log(`✅ Database already has ${existingCount} claims. Skipping seed.`);
      return;
    }

    // Insert sample claims
    const inserted = await Claim.insertMany(sampleClaims);
    console.log(`✅ Seeded ${inserted.length} sample claims into database`);
    
    return inserted;
  } catch (error) {
    console.error('❌ Error seeding claims:', error);
  }
}

module.exports = seedClaims;
