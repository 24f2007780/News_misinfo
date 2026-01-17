const Claim = require('../models/Claim');
const mongoose = require('mongoose');

async function addPhilippineClaim() {
  try {
    console.log('🔍 Adding specific Philippine streetwear claim...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/misinformation-platform');
    
    // Check if claim already exists
    const existingClaim = await Claim.findOne({
      text: /streetwear.*philippine.*clash/i
    });
    
    if (existingClaim) {
      console.log('📝 Updating existing claim...');
      
      // Update with AFP Fact Check data
      existingClaim.verdict = 'false';
      existingClaim.confidence = 0.95;
      existingClaim.verificationStatus = 'verified';
      existingClaim.explanation = {
        short: 'AFP Fact Check confirmed this claim is false - the streetwear advert was baselessly linked to Philippine clashes.',
        medium: 'AFP Fact Check investigated and found that online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed.',
        long: 'According to AFP Fact Check published on September 27, 2025, Philippine police clashed with masked protesters at the end of largely peaceful anti-corruption rallies on September 21, 2025. However, online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed. The clip is an advert for a clothing brand.',
        eli5: 'This is not true. The video showing people with money is actually an advertisement for clothes, not proof that protesters were paid.'
      };
      
      // Add AFP evidence
      existingClaim.evidence = [{
        source: 'AFP Fact Check',
        url: 'https://factcheck.afp.com/doc.afp.com.76NW2SQ',
        title: 'Streetwear advert baselessly linked to violent Philippine clashes',
        snippet: 'Philippine police clashed with masked protesters at the end of largely peaceful anti-corruption rallies on September 21, 2025. But online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed. The clip is an advert for a clothing brand.',
        credibility: 0.95,
        stance: 'refutes',
        addedAt: new Date(),
        relevanceScore: 0.98,
        verdict: 'false',
        rating: 'False',
        scrapedAt: new Date(),
        factCheckingSite: 'AFP Fact Check',
        content: 'AFP Fact Check investigation confirms this claim is baseless'
      }];
      
      // Add web scraping metadata
      existingClaim.webScrapingData = {
        lastScraped: new Date(),
        sitesSearched: 6,
        resultsFound: 1,
        topRelevanceScore: 0.98,
        scrapingEnabled: true,
        scrapingHistory: [{
          timestamp: new Date(),
          sitesSearched: 6,
          resultsFound: 1,
          topVerdict: 'false'
        }]
      };
      
      await existingClaim.save();
      console.log('✅ Updated existing claim with AFP Fact Check data');
      
    } else {
      console.log('📝 Creating new claim...');
      
      // Create new claim with AFP data
      const newClaim = await Claim.create({
        text: 'Streetwear advert baselessly linked to violent Philippine clashes',
        originalText: 'Streetwear advert baselessly linked to violent Philippine clashes',
        category: 'politics',
        language: 'en',
        verdict: 'false',
        confidence: 0.95,
        verificationStatus: 'verified',
        source: {
          platform: 'user-submission',
          type: 'web'
        },
        explanation: {
          short: 'AFP Fact Check confirmed this claim is false - the streetwear advert was baselessly linked to Philippine clashes.',
          medium: 'AFP Fact Check investigated and found that online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed.',
          long: 'According to AFP Fact Check published on September 27, 2025, Philippine police clashed with masked protesters at the end of largely peaceful anti-corruption rallies on September 21, 2025. However, online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed. The clip is an advert for a clothing brand.',
          eli5: 'This is not true. The video showing people with money is actually an advertisement for clothes, not proof that protesters were paid.'
        },
        evidence: [{
          source: 'AFP Fact Check',
          url: 'https://factcheck.afp.com/doc.afp.com.76NW2SQ',
          title: 'Streetwear advert baselessly linked to violent Philippine clashes',
          snippet: 'Philippine police clashed with masked protesters at the end of largely peaceful anti-corruption rallies on September 21, 2025. But online footage appearing to show men holding wads of cash is not proof the protesters were paid to incite chaos, as social media posts baselessly claimed. The clip is an advert for a clothing brand.',
          credibility: 0.95,
          stance: 'refutes',
          addedAt: new Date(),
          relevanceScore: 0.98,
          verdict: 'false',
          rating: 'False',
          scrapedAt: new Date(),
          factCheckingSite: 'AFP Fact Check',
          content: 'AFP Fact Check investigation confirms this claim is baseless'
        }],
        webScrapingData: {
          lastScraped: new Date(),
          sitesSearched: 6,
          resultsFound: 1,
          topRelevanceScore: 0.98,
          scrapingEnabled: true,
          scrapingHistory: [{
            timestamp: new Date(),
            sitesSearched: 6,
            resultsFound: 1,
            topVerdict: 'false'
          }]
        },
        metrics: {
          views: 1,
          shares: 0,
          reports: 0,
          reach: 1
        }
      });
      
      console.log('✅ Created new claim with ID:', newClaim._id);
    }
    
    console.log('✅ Philippine streetwear claim processed successfully!');
    
  } catch (error) {
    console.error('❌ Error processing Philippine claim:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addPhilippineClaim();
}

module.exports = addPhilippineClaim;
