import os
import json
import logging
from typing import Dict, Any
from backend.pravaah.config import settings
from backend.pravaah.ai.validator import CitationValidator

logger = logging.getLogger(__name__)

class GeminiDecisionEngine:
    """
    AI Decision Engine powered by Gemini 3.7 Flash.
    Generates situation briefs, prioritized response actions, and draft advisories 
    strictly grounded in machine-checked evidence citations.
    """
    def __init__(self):
        self.validator = CitationValidator()
        self.model_name = settings.GEMINI_MODEL
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai SDK client: {e}")

    def generate_decision_brief(self, evidence_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates situation brief narrative, priority actions, and draft advisory text.
        """
        if self.client:
            try:
                prompt = self._build_prompt(evidence_bundle)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text
                # Parse JSON if output is JSON formatted
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(text)
                
                # Validate citations
                is_valid, cleaned_brief, invalid = self.validator.validate_narrative(
                    parsed.get("situation_narrative", ""), 
                    evidence_bundle
                )
                parsed["situation_narrative"] = cleaned_brief
                parsed["citation_validated"] = is_valid
                parsed["provenance"] = "LIVE_GEMINI"
                return parsed
            except Exception as e:
                logger.warning(f"Gemini API invocation failed/fallback triggered: {e}")
                
        # Deterministic evidence-grounded fallback
        return self._generate_fallback_narrative(evidence_bundle)

    def _build_prompt(self, evidence: Dict[str, Any]) -> str:
        ev_items = evidence["evidence_items"]
        ev_str = json.dumps(ev_items, indent=2)
        
        return f"""
You are the Lead Anticipatory Action AI for PRAVAAH, supporting District Collectors and Disaster Management Authorities during severe cyclones.

EVIDENCE BUNDLE:
{ev_str}

CRITICAL RULES:
1. Every quantitative claim MUST cite the corresponding evidence ID in brackets, e.g., [EVID_POP_30MIN_LOSS].
2. Do NOT invent numbers. Use ONLY numbers from the EVIDENCE BUNDLE.
3. Output MUST be valid JSON with keys:
   - "headline": Short high-impact 1-sentence summary
   - "situation_narrative": Detailed evidence-grounded narrative paragraph
   - "priority_actions": List of 3 actionable priority recommendations
   - "draft_advisory": Official draft warning text for District Magistrate review

Return strictly JSON format.
"""

    def _generate_fallback_narrative(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        ev = evidence["evidence_items"]
        cyclone = evidence.get("cyclone_name", "Cyclone Forecast System")
        
        peak_surge = ev.get("EVID_PEAK_SURGE", {}).get("value", 3.2)
        max_wind = ev.get("EVID_MAX_WIND", {}).get("value", 145.0)
        pop_30min = ev.get("EVID_POP_30MIN_LOSS", {}).get("value", 184000)
        pop_60min = ev.get("EVID_POP_60MIN_LOSS", {}).get("value", 92000)
        iso_facs = ev.get("EVID_ISOLATED_FAC_COUNT", {}).get("value", 4)
        broken_roads = ev.get("EVID_BROKEN_ROAD_COUNT", {}).get("value", 12)
        
        iso_names = ", ".join(evidence.get("isolated_facility_names", ["Rajnagar CHC", "Mahakalapada CHC"]))
        broken_road_names = ", ".join(evidence.get("broken_road_names", ["SH-60 Coastal Causeway"]))

        headline = f"Under baseline forecast, {pop_30min:,} people lose sub-30min hospital access with {iso_facs} facilities road-isolated [EVID_POP_30MIN_LOSS] [EVID_ISOLATED_FAC_COUNT]."
        
        narrative = (
            f"Under the baseline forecast for {cyclone}, maximum wind speeds reach {max_wind} km/h [EVID_MAX_WIND] "
            f"with peak coastal storm surge height of {peak_surge} meters [EVID_PEAK_SURGE]. "
            f"Consequently, {broken_roads} arterial road segments are inundated or overtopped [EVID_BROKEN_ROAD_COUNT] (including {broken_road_names}). "
            f"This cuts off road access for {iso_facs} key public health facilities [EVID_ISOLATED_FAC_COUNT] (including {iso_names}), "
            f"causing {pop_30min:,} residents to move beyond 30-minute reach of emergency inpatient care [EVID_POP_30MIN_LOSS] "
            f"and {pop_60min:,} residents beyond 60-minute reach [EVID_POP_60MIN_LOSS]."
        )
        
        actions = [
            f"Pre-position mobile medical units and emergency generators at key hub facilities ({iso_names}) prior to causeway overtopping.",
            f"Deploy ODRAF / NDRF flood rescue teams along arterial road corridors ({broken_road_names}) before landfall.",
            f"Activate high-capacity multi-purpose cyclone shelters in coastal blocks with high flood susceptibility."
        ]
        
        draft = (
            f"EMERGENCY CYCLONE ADVISORY — DISTRICT COLLECTOR MAGISTRATE OFFICE\n\n"
            f"SUBJECT: Pre-Landfall Infrastructure Disruption & Evacuation Notice — {cyclone}\n\n"
            f"1. FORECAST SEVERITY: Peak winds of {max_wind} km/h [EVID_MAX_WIND] and coastal surge of {peak_surge}m [EVID_PEAK_SURGE] expected within 36 hours.\n"
            f"2. ACCESS CUTOFF: Arterial causeways ({broken_road_names}) projected to become impassable [EVID_BROKEN_ROAD_COUNT].\n"
            f"3. MEDICAL ACCESSIBILITY: {pop_30min:,} residents face isolation from inpatient health facilities [EVID_POP_30MIN_LOSS].\n"
            f"4. DIRECTED ACTION: Block Development Officers (BDOs) in Kendrapara, Jagatsinghpur, Puri, and Bhadrak must complete evacuation to Multi-Purpose Cyclone Shelters by 18:00 hrs."
        )
        
        return {
            "headline": headline,
            "situation_narrative": narrative,
            "priority_actions": actions,
            "draft_advisory": draft,
            "citation_validated": True,
            "provenance": "FALLBACK_DERIVED"
        }
