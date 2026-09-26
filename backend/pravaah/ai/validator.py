import re
from typing import Dict, Any, List, Tuple

class CitationValidator:
    """
    Hard gate for LLM grounding safety (§14.5).
    Validates that numerical claims in Gemini generated text cite valid evidence_ids
    and accurately match numerical values present in the evidence bundle.
    """
    def validate_narrative(self, narrative: str, evidence_bundle: Dict[str, Any]) -> Tuple[bool, str, List[str]]:
        evidence_items = evidence_bundle.get("evidence_items", {})
        valid_ids = set(evidence_items.keys())
        
        # Regex to match citations like [EVID_PEAK_SURGE] or [EVID_POP_30MIN_LOSS]
        citation_pattern = re.compile(r'\[(EVID_[A-Z0-9_]+)\]')
        found_citations = citation_pattern.findall(narrative)
        
        invalid_items = []
        
        # 1. Reject invalid citation tags
        for c in found_citations:
            if c not in valid_ids:
                invalid_items.append(f"INVALID_ID_{c}")
                
        # 2. Check for fabricated numerical claims near citations
        # e.g. "999,000 people will lose hospital access [EVID_POP_30MIN_LOSS]" where actual evidence value is 184000
        number_citation_pattern = re.compile(r'([\d,]+(?:\.\d+)?)\s*(?:[a-zA-Z\s,/\-%–]{0,80})\s*\[(EVID_[A-Z0-9_]+)\]')
        for match in number_citation_pattern.finditer(narrative):
            num_str, ev_id = match.groups()
            if ev_id in evidence_items:
                try:
                    num_val = float(num_str.replace(",", ""))
                    ev_val = float(evidence_items[ev_id].get("value", 0))
                    # Allow up to 5% tolerance for minor rounding (e.g. 184.2k)
                    if ev_val > 0 and abs(num_val - ev_val) / ev_val > 0.05:
                        invalid_items.append(f"MISMATCH_NUMERICAL_{ev_id}_claim_{num_val}_vs_truth_{ev_val}")
                except ValueError:
                    pass
                    
        is_valid = len(invalid_items) == 0
        cleaned_narrative = narrative
        
        if not is_valid:
            for inv in invalid_items:
                if inv.startswith("INVALID_ID_"):
                    raw_id = inv.replace("INVALID_ID_", "")
                    cleaned_narrative = cleaned_narrative.replace(f"[{raw_id}]", "")
                    
        return is_valid, cleaned_narrative, invalid_items
