const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Claim = require('../models/Claim');

class MLVerificationService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '..', 'ml_models', 'claim_verifier.py');
    this.trainingDataPath = path.join(__dirname, '..', 'ml_models', 'training_data.json');
    this.modelInitialized = false;
    this.trainingData = null;
    this.supportedModels = [
      'microsoft/DialoGPT-medium',
      'facebook/bart-large-mnli',
      'roberta-large-mnli',
      'microsoft/deberta-v3-large-mnli'
    ];
    
    // Evidence retrieval settings
    this.maxEvidenceItems = 5;
    this.similarityThreshold = 0.6;
    
    // Load training data
    this.loadTrainingData();
  }

  /**
   * Load training data from JSON file
   */
  loadTrainingData() {
    try {
      if (fs.existsSync(this.trainingDataPath)) {
        const data = fs.readFileSync(this.trainingDataPath, 'utf8');
        this.trainingData = JSON.parse(data);
        console.log('✅ Training data loaded successfully');
      } else {
        console.warn('⚠️ Training data file not found');
      }
    } catch (error) {
      console.error('❌ Failed to load training data:', error);
    }
  }

  /**
   * Initialize ML models (called on server startup)
   */
  async initializeModels() {
    try {
      console.log('🤖 Initializing ML verification models...');
      
      // Check if Python script exists
      if (!fs.existsSync(this.pythonScriptPath)) {
        console.log('📝 Creating Python ML verification script...');
        await this.createPythonScript();
      }

      // Test model initialization
      const testResult = await this.runPythonScript('test', { text: 'test claim' });
      
      if (testResult.success) {
        this.modelInitialized = true;
        console.log('✅ ML verification models initialized successfully');
        return true;
      } else {
        console.error('❌ ML model initialization failed:', testResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize ML models:', error);
      return false;
    }
  }

  /**
   * Verify claim using ML models with evidence retrieval and training data
   */
  async verifyClaim(claimText, evidence = [], category = 'other') {
    try {
      console.log(`🧠 ML verification for: "${claimText.substring(0, 50)}..." in category: ${category}`);
      console.log(`📚 Training data loaded: ${this.trainingData ? 'Yes' : 'No'}`);
      
      // Step 1: Check against training data first
      const trainingResult = this.checkAgainstTrainingData(claimText, category);
      if (trainingResult) {
        console.log('✅ Found exact match in training data:', {
          verdict: trainingResult.verdict,
          confidence: trainingResult.confidence,
          source: trainingResult.source
        });
        return trainingResult;
      } else {
        console.log('❌ No exact match found in training data');
      }
      
      // Step 2: Preprocess the claim
      const preprocessedClaim = this.preprocessClaim(claimText);
      
      // Step 3: Retrieve relevant evidence from database
      const dbEvidence = await this.retrieveRelevantEvidence(claimText);
      
      // Step 4: Combine web-scraped evidence with database evidence
      const allEvidence = [...evidence, ...dbEvidence];
      
      // Step 5: Use similarity matching with training data
      const similarityResult = this.findSimilarTrainingClaims(claimText, category);
      if (similarityResult) {
        console.log('✅ Found similar claim in training data');
        return similarityResult;
      }
      
      // Step 6: Run ML verification if available
      if (this.modelInitialized) {
        const mlResult = await this.runPythonScript('verify', {
          claim: preprocessedClaim,
          evidence: allEvidence.slice(0, this.maxEvidenceItems),
          category: category,
          training_data: this.trainingData
        });

        if (mlResult.success) {
          return this.formatVerificationResult(mlResult.data, claimText, allEvidence);
        }
      }
      
      // Step 7: Fallback to pattern matching
      return this.patternBasedVerification(claimText, allEvidence);

    } catch (error) {
      console.error('❌ ML verification failed:', error);
      return this.patternBasedVerification(claimText, evidence);
    }
  }

  /**
   * Check claim against training data for exact matches
   */
  checkAgainstTrainingData(claimText, category) {
    if (!this.trainingData || !this.trainingData[category]) {
      console.log(`⚠️ No training data for category: ${category}`);
      return null;
    }

    const normalizedClaim = claimText.toLowerCase().trim();
    const categoryData = this.trainingData[category];
    
    console.log(`🔍 Checking against ${categoryData.true?.length || 0} true claims and ${categoryData.false?.length || 0} false claims`);

    // Check true claims
    for (const trueClaim of categoryData.true) {
      const normalizedTraining = trueClaim.toLowerCase().trim();
      const similarity = this.calculateTextSimilarity(normalizedClaim, normalizedTraining);
      console.log(`📊 Similarity with "${trueClaim}": ${(similarity * 100).toFixed(1)}%`);
      
      // Check for exact match first
      if (normalizedClaim === normalizedTraining) {
        console.log('🎯 Exact string match found!');
        return {
          verdict: 'supported',
          confidence: 0.95,
          reasoning: `Exact match with known true claim: "${trueClaim}"`,
          source: 'training-data-exact',
          explanation: {
            short: 'This claim exactly matches verified information in our training data',
            medium: `This claim is an exact match with verified information in our ${category} training data`,
            long: `Our system found an exact match for this claim in our verified training data for the ${category} category`,
            eli5: 'Our computer knows this is exactly true from what it learned before'
          }
        };
      }
      
      if (similarity > 0.85) {
        return {
          verdict: 'supported',
          confidence: 0.92,
          reasoning: `Matches known true claim in ${category} category`,
          source: 'training-data-exact',
          explanation: {
            short: 'This claim matches verified information in our training data',
            medium: `Based on our training data for ${category}, this claim is supported by established facts`,
            long: `Our machine learning system identified this claim as matching verified information in the ${category} category with high confidence`,
            eli5: 'Our computer knows this is true from what it learned before'
          }
        };
      }
    }

    // Check false claims
    for (const falseClaim of categoryData.false) {
      if (this.calculateTextSimilarity(normalizedClaim, falseClaim.toLowerCase()) > 0.85) {
        return {
          verdict: 'refuted',
          confidence: 0.94,
          reasoning: `Matches known false claim in ${category} category`,
          source: 'training-data-exact',
          explanation: {
            short: 'This claim matches debunked information in our training data',
            medium: `Based on our training data for ${category}, this claim has been identified as false`,
            long: `Our machine learning system identified this claim as matching debunked information in the ${category} category with high confidence`,
            eli5: 'Our computer knows this is false from what it learned before'
          }
        };
      }
    }

    return null;
  }

  /**
   * Find similar claims in training data using fuzzy matching
   */
  findSimilarTrainingClaims(claimText, category) {
    if (!this.trainingData) {
      return null;
    }

    const normalizedClaim = claimText.toLowerCase().trim();
    let bestMatch = null;
    let bestSimilarity = 0;
    let bestVerdict = null;

    // Check all categories if specific category not found
    const categoriesToCheck = this.trainingData[category] ? [category] : Object.keys(this.trainingData);

    for (const cat of categoriesToCheck) {
      const categoryData = this.trainingData[cat];
      
      // Check true claims
      for (const trueClaim of categoryData.true) {
        const similarity = this.calculateTextSimilarity(normalizedClaim, trueClaim.toLowerCase());
        if (similarity > bestSimilarity && similarity > 0.6) {
          bestSimilarity = similarity;
          bestMatch = trueClaim;
          bestVerdict = 'supported';
        }
      }

      // Check false claims
      for (const falseClaim of categoryData.false) {
        const similarity = this.calculateTextSimilarity(normalizedClaim, falseClaim.toLowerCase());
        if (similarity > bestSimilarity && similarity > 0.6) {
          bestSimilarity = similarity;
          bestMatch = falseClaim;
          bestVerdict = 'refuted';
        }
      }
    }

    if (bestMatch && bestSimilarity > 0.6) {
      const confidence = Math.min(0.85, 0.5 + (bestSimilarity * 0.4));
      return {
        verdict: bestVerdict,
        confidence,
        reasoning: `Similar to training claim: "${bestMatch}" (${(bestSimilarity * 100).toFixed(1)}% similarity)`,
        source: 'training-data-similarity',
        explanation: {
          short: `Similar to ${bestVerdict === 'supported' ? 'verified' : 'debunked'} information in our training data`,
          medium: `This claim is similar to ${bestVerdict === 'supported' ? 'verified' : 'debunked'} information in our training data with ${(bestSimilarity * 100).toFixed(1)}% similarity`,
          long: `Our machine learning system found this claim to be ${(bestSimilarity * 100).toFixed(1)}% similar to ${bestVerdict === 'supported' ? 'verified' : 'debunked'} information in our training data: "${bestMatch}"`,
          eli5: `This is similar to something our computer already knows is ${bestVerdict === 'supported' ? 'true' : 'false'}`
        }
      };
    }

    return null;
  }

  /**
   * Pattern-based verification as fallback
   */
  patternBasedVerification(claimText, evidence) {
    // Basic patterns for common claims
    const patterns = {
      supported: [
        /water boils.*100.*celsius/i,
        /earth.*revolves.*around.*sun/i,
        /vaccines.*reduce.*risk/i,
        /smoking.*increases.*risk.*cancer/i
      ],
      refuted: [
        /vaccines.*cause.*autism/i,
        /earth.*is.*flat/i,
        /climate.*change.*hoax/i,
        /covid.*vaccines.*microchip/i
      ]
    };

    const normalizedClaim = claimText.toLowerCase();

    for (const pattern of patterns.supported) {
      if (pattern.test(normalizedClaim)) {
        return {
          verdict: 'supported',
          confidence: 0.75,
          reasoning: 'Matches known supported pattern',
          source: 'pattern-matching',
          explanation: {
            short: 'This matches well-established facts',
            medium: 'This claim matches patterns of well-established factual information',
            long: 'Our pattern matching system identified this claim as consistent with well-established facts',
            eli5: 'This matches things we know are true'
          }
        };
      }
    }

    for (const pattern of patterns.refuted) {
      if (pattern.test(normalizedClaim)) {
        return {
          verdict: 'refuted',
          confidence: 0.80,
          reasoning: 'Matches known refuted pattern',
          source: 'pattern-matching',
          explanation: {
            short: 'This matches debunked misinformation',
            medium: 'This claim matches patterns of known misinformation that has been debunked',
            long: 'Our pattern matching system identified this claim as consistent with known misinformation',
            eli5: 'This matches things we know are false'
          }
        };
      }
    }

    return {
      verdict: 'not_enough_info',
      confidence: 0.3,
      reasoning: 'No matching patterns or training data found',
      source: 'fallback',
      explanation: {
        short: 'Insufficient information to verify this claim',
        medium: 'We could not find sufficient information in our training data or patterns to verify this claim',
        long: 'Our verification system could not find matching information in training data, similar claims, or established patterns',
        eli5: 'We don\'t have enough information to know if this is true or false'
      }
    };
  }

  /**
   * Preprocess claim text for ML model
   */
  preprocessClaim(claimText) {
    return claimText
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .substring(0, 512); // Limit for BERT models
  }

  /**
   * Retrieve relevant evidence from database using similarity
   */
  async retrieveRelevantEvidence(claimText) {
    try {
      // Get claims with evidence from database
      const existingClaims = await Claim.find({
        evidence: { $exists: true, $ne: [] },
        $text: { $search: claimText }
      })
      .limit(10)
      .select('text evidence verdict confidence');

      const relevantEvidence = [];
      
      for (const claim of existingClaims) {
        const similarity = this.calculateTextSimilarity(claimText, claim.text);
        
        if (similarity > this.similarityThreshold) {
          claim.evidence.forEach(evidenceItem => {
            relevantEvidence.push({
              ...evidenceItem.toObject(),
              similarity,
              sourceClaimId: claim._id
            });
          });
        }
      }

      return relevantEvidence
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
        
    } catch (error) {
      console.warn('⚠️ Failed to retrieve database evidence:', error);
      return [];
    }
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Format verification result according to your requirements
   */
  formatVerificationResult(mlData, originalClaim, evidence) {
    const { verdict, confidence, reasoning, evidence_analysis } = mlData;
    
    // Map ML verdict to your format
    let formattedVerdict;
    let emoji;
    
    switch (verdict.toLowerCase()) {
      case 'supported':
      case 'true':
      case 'supports':
        formattedVerdict = 'Supported';
        emoji = '✅';
        break;
      case 'refuted':
      case 'false':
      case 'refutes':
        formattedVerdict = 'Refuted';
        emoji = '❌';
        break;
      case 'not_enough_info':
      case 'insufficient':
      case 'neutral':
      default:
        formattedVerdict = 'Not Enough Information';
        emoji = '⚪';
        break;
    }

    const confidencePercent = Math.round(confidence * 100);
    
    return {
      verdict: formattedVerdict.toLowerCase().replace(' ', '_'),
      confidence,
      formattedResult: `${emoji} ${formattedVerdict} (Confidence: ${confidencePercent}%)`,
      explanation: {
        short: reasoning || `ML analysis indicates this claim is ${formattedVerdict.toLowerCase()}`,
        medium: `Based on analysis of available evidence, our ML model determined this claim is ${formattedVerdict.toLowerCase()} with ${confidencePercent}% confidence.`,
        long: `Our machine learning verification system analyzed the claim "${originalClaim}" against available evidence sources. The analysis involved natural language inference using transformer models trained on fact-checking datasets. Result: ${formattedVerdict} with ${confidencePercent}% confidence. ${reasoning || ''}`,
        eli5: `The computer looked at this claim and compared it with what it knows. It thinks this claim is ${formattedVerdict.toLowerCase()}.`
      },
      evidence: evidence.slice(0, 5).map(e => ({
        ...e,
        ml_analysis: evidence_analysis?.find(ea => ea.evidence_id === e.id) || null
      })),
      source: 'ml-analysis',
      mlAnalysis: {
        model: 'transformer-based-nli',
        reasoning,
        confidence,
        evidence_count: evidence.length,
        processed_at: new Date()
      }
    };
  }

  /**
   * Run Python ML script
   */
  async runPythonScript(action, data) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScriptPath, action], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve({ success: true, data: result });
          } catch (error) {
            resolve({ success: false, error: 'Failed to parse Python output' });
          }
        } else {
          resolve({ success: false, error: stderr || 'Python script failed' });
        }
      });

      // Send input data
      python.stdin.write(JSON.stringify(data));
      python.stdin.end();

      // Timeout after 30 seconds
      setTimeout(() => {
        python.kill();
        reject(new Error('ML verification timeout'));
      }, 30000);
    });
  }

  /**
   * Create Python ML verification script
   */
  async createPythonScript() {
    const mlDir = path.join(__dirname, '..', 'ml_models');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(mlDir)) {
      fs.mkdirSync(mlDir, { recursive: true });
    }

    const pythonScript = `#!/usr/bin/env python3
import json
import sys
import logging
from typing import Dict, List, Any
import warnings
warnings.filterwarnings('ignore')

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    import numpy as np
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

class ClaimVerifier:
    def __init__(self):
        self.nli_model = None
        self.similarity_model = None
        self.initialized = False
        
    def initialize_models(self):
        """Initialize ML models"""
        if not TRANSFORMERS_AVAILABLE:
            raise Exception("Required ML libraries not installed. Run: pip install transformers torch sentence-transformers")
        
        try:
            # Load NLI model for claim verification
            self.nli_model = pipeline(
                "text-classification",
                model="facebook/bart-large-mnli",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Load sentence transformer for similarity
            self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            self.initialized = True
            return True
        except Exception as e:
            # Fallback to smaller models if large ones fail
            try:
                self.nli_model = pipeline(
                    "text-classification",
                    model="microsoft/DialoGPT-medium",
                    device=-1
                )
                self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
                self.initialized = True
                return True
            except Exception as e2:
                raise Exception(f"Failed to initialize models: {str(e2)}")
    
    def verify_claim(self, claim: str, evidence: List[Dict]) -> Dict[str, Any]:
        """Verify claim against evidence using NLI"""
        if not self.initialized:
            self.initialize_models()
        
        if not evidence:
            return {
                "verdict": "not_enough_info",
                "confidence": 0.3,
                "reasoning": "No evidence provided for verification",
                "evidence_analysis": []
            }
        
        evidence_scores = []
        
        for i, evidence_item in enumerate(evidence):
            evidence_text = evidence_item.get('snippet', '') or evidence_item.get('content', '')
            
            if not evidence_text:
                continue
                
            # Create hypothesis for NLI
            hypothesis = f"The claim '{claim}' is supported by this evidence."
            premise = evidence_text[:512]  # Limit text length
            
            try:
                # Run NLI classification
                result = self.nli_model(f"{premise} [SEP] {hypothesis}")
                
                # Extract confidence and label
                if isinstance(result, list):
                    result = result[0]
                
                label = result['label'].lower()
                score = result['score']
                
                # Map labels to our format
                if 'entail' in label or 'support' in label:
                    stance = 'supports'
                elif 'contradict' in label or 'refute' in label:
                    stance = 'refutes'
                else:
                    stance = 'neutral'
                
                evidence_scores.append({
                    'evidence_id': i,
                    'stance': stance,
                    'confidence': score,
                    'source': evidence_item.get('source', 'Unknown')
                })
                
            except Exception as e:
                print(f"Error processing evidence {i}: {str(e)}", file=sys.stderr)
                continue
        
        # Aggregate results
        if not evidence_scores:
            return {
                "verdict": "not_enough_info",
                "confidence": 0.2,
                "reasoning": "Unable to process evidence",
                "evidence_analysis": []
            }
        
        # Calculate overall verdict
        support_scores = [e['confidence'] for e in evidence_scores if e['stance'] == 'supports']
        refute_scores = [e['confidence'] for e in evidence_scores if e['stance'] == 'refutes']
        
        avg_support = np.mean(support_scores) if support_scores else 0
        avg_refute = np.mean(refute_scores) if refute_scores else 0
        
        if avg_support > avg_refute and avg_support > 0.6:
            verdict = "supported"
            confidence = avg_support
        elif avg_refute > avg_support and avg_refute > 0.6:
            verdict = "refuted"
            confidence = avg_refute
        else:
            verdict = "not_enough_info"
            confidence = max(avg_support, avg_refute, 0.4)
        
        reasoning = f"Analyzed {len(evidence_scores)} evidence items. "
        if support_scores:
            reasoning += f"{len(support_scores)} support the claim (avg: {avg_support:.2f}). "
        if refute_scores:
            reasoning += f"{len(refute_scores)} refute the claim (avg: {avg_refute:.2f}). "
        
        return {
            "verdict": verdict,
            "confidence": min(confidence, 0.95),  # Cap confidence
            "reasoning": reasoning,
            "evidence_analysis": evidence_scores
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        return
    
    action = sys.argv[1]
    
    try:
        # Read input data
        input_data = json.loads(sys.stdin.read())
        
        verifier = ClaimVerifier()
        
        if action == "test":
            # Test initialization
            verifier.initialize_models()
            print(json.dumps({"status": "initialized", "models_available": TRANSFORMERS_AVAILABLE}))
            
        elif action == "verify":
            # Verify claim
            claim = input_data.get("claim", "")
            evidence = input_data.get("evidence", [])
            
            result = verifier.verify_claim(claim, evidence)
            print(json.dumps(result))
            
        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

    fs.writeFileSync(this.pythonScriptPath, pythonScript);
    console.log('✅ Python ML verification script created');
  }

  /**
   * Install required Python packages
   */
  async installPythonDependencies() {
    return new Promise((resolve, reject) => {
      console.log('📦 Installing Python ML dependencies...');
      
      const pip = spawn('pip', ['install', 'transformers', 'torch', 'sentence-transformers', 'numpy'], {
        stdio: 'inherit'
      });

      pip.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Python dependencies installed successfully');
          resolve(true);
        } else {
          console.error('❌ Failed to install Python dependencies');
          resolve(false);
        }
      });

      pip.on('error', (error) => {
        console.error('❌ Error installing dependencies:', error);
        resolve(false);
      });
    });
  }

  /**
   * Get ML service status
   */
  getStatus() {
    return {
      initialized: this.modelInitialized,
      pythonScriptExists: fs.existsSync(this.pythonScriptPath),
      supportedModels: this.supportedModels
    };
  }
}

module.exports = new MLVerificationService();
