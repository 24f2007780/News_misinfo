#!/usr/bin/env python3
import json
import sys
import logging
from typing import Dict, List, Any
import warnings
warnings.filterwarnings('ignore')

# Simple fallback implementation without heavy ML dependencies
class SimpleClaimVerifier:
    def __init__(self):
        self.initialized = False
        self.patterns = {
            'supported': [
                'earth revolves around sun', 'earth orbits sun', 'sun center solar system',
                'gravity exists', 'water boils 100 celsius', 'broccoli green vegetable',
                'drinking water helps hydration', 'vaccines prevent disease'
            ],
            'refuted': [
                'vaccines cause autism', 'earth is flat', 'climate change hoax',
                'global warming hoax', '5g causes covid', 'moon landing fake'
            ]
        }
        
    def initialize_models(self):
        """Initialize simple pattern matching"""
        try:
            # Try to import ML libraries
            import numpy as np
            self.has_numpy = True
            print("✅ NumPy available", file=sys.stderr)
        except ImportError:
            self.has_numpy = False
            print("⚠️ NumPy not available, using basic matching", file=sys.stderr)
            
        try:
            import sklearn
            self.has_sklearn = True
            print("✅ Scikit-learn available", file=sys.stderr)
        except ImportError:
            self.has_sklearn = False
            print("⚠️ Scikit-learn not available", file=sys.stderr)
            
        self.initialized = True
        return True
    
    def verify_claim(self, claim: str, evidence: List[Dict]) -> Dict[str, Any]:
        """Simple pattern-based verification with evidence analysis"""
        claim_lower = claim.lower().strip()
        
        # Check against known patterns
        for pattern in self.patterns['supported']:
            if pattern in claim_lower:
                return {
                    "verdict": "supported",
                    "confidence": 0.85,
                    "reasoning": f"Claim matches known supported pattern: {pattern}",
                    "evidence_analysis": self._analyze_evidence(evidence, 'supports')
                }
        
        for pattern in self.patterns['refuted']:
            if pattern in claim_lower:
                return {
                    "verdict": "refuted", 
                    "confidence": 0.90,
                    "reasoning": f"Claim matches known refuted pattern: {pattern}",
                    "evidence_analysis": self._analyze_evidence(evidence, 'refutes')
                }
        
        # Analyze evidence if available
        if evidence:
            return self._analyze_with_evidence(claim, evidence)
        
        # Default response
        return {
            "verdict": "not_enough_info",
            "confidence": 0.4,
            "reasoning": "No matching patterns found and insufficient evidence",
            "evidence_analysis": []
        }
    
    def _analyze_evidence(self, evidence: List[Dict], default_stance: str) -> List[Dict]:
        """Analyze evidence items"""
        analysis = []
        for i, item in enumerate(evidence[:5]):  # Limit to 5 items
            analysis.append({
                'evidence_id': i,
                'stance': default_stance,
                'confidence': 0.7,
                'source': item.get('source', 'Unknown')
            })
        return analysis
    
    def _analyze_with_evidence(self, claim: str, evidence: List[Dict]) -> Dict[str, Any]:
        """Simple evidence-based analysis"""
        if not evidence:
            return {
                "verdict": "not_enough_info",
                "confidence": 0.3,
                "reasoning": "No evidence provided",
                "evidence_analysis": []
            }
        
        # Simple keyword matching with evidence
        claim_words = set(claim.lower().split())
        
        support_count = 0
        refute_count = 0
        
        for item in evidence:
            evidence_text = (item.get('snippet', '') + ' ' + item.get('title', '')).lower()
            evidence_words = set(evidence_text.split())
            
            # Simple overlap analysis
            overlap = len(claim_words.intersection(evidence_words))
            
            if overlap > 2:  # Some overlap found
                # Check for supporting/refuting keywords
                if any(word in evidence_text for word in ['true', 'correct', 'confirmed', 'proven']):
                    support_count += 1
                elif any(word in evidence_text for word in ['false', 'wrong', 'debunked', 'myth']):
                    refute_count += 1
        
        if support_count > refute_count:
            verdict = "supported"
            confidence = min(0.8, 0.5 + (support_count * 0.1))
        elif refute_count > support_count:
            verdict = "refuted"
            confidence = min(0.8, 0.5 + (refute_count * 0.1))
        else:
            verdict = "not_enough_info"
            confidence = 0.4
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "reasoning": f"Evidence analysis: {support_count} supporting, {refute_count} refuting items",
            "evidence_analysis": self._analyze_evidence(evidence, 'supports' if verdict == 'supported' else 'refutes')
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        return
    
    action = sys.argv[1]
    
    try:
        # Read input data
        input_data = json.loads(sys.stdin.read())
        
        verifier = SimpleClaimVerifier()
        
        if action == "test":
            # Test initialization
            verifier.initialize_models()
            print(json.dumps({"status": "initialized", "method": "simple_patterns"}))
            
        elif action == "verify":
            # Verify claim
            claim = input_data.get("claim", "")
            evidence = input_data.get("evidence", [])
            
            verifier.initialize_models()
            result = verifier.verify_claim(claim, evidence)
            print(json.dumps(result))
            
        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
