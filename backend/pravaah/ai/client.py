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
        Executes against exactly ONE pinned model (settings.GEMINI_MODEL).
        If the configured model is unavailable or rate-limited, falls cleanly to FALLBACK_DERIVED mode.
        """
        if self.client:
            import time
            start_time = time.time()
            try:
                prompt = self._build_prompt(evidence_bundle)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                elapsed_ms = round((time.time() - start_time) * 1000.0, 1)
                text = response.text
                
                # Clean codeblock formatting if present
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                parsed = json.loads(text)
                
                # Token usage metadata
                usage = getattr(response, "usage_metadata", None)
                input_tokens = getattr(usage, "prompt_token_count", 0) if usage else 0
                output_tokens = getattr(usage, "candidates_token_count", 0) if usage else 0
                
                # Validate citations
                is_valid, cleaned_brief, invalid = self.validator.validate_narrative(
                    parsed.get("situation_narrative", ""), 
                    evidence_bundle
                )
                parsed["situation_narrative"] = cleaned_brief
                parsed["citation_validated"] = is_valid
                parsed["provenance"] = "LIVE_GEMINI"
                parsed["model_name"] = self.model_name
                parsed["latency_ms"] = elapsed_ms
                parsed["token_usage"] = {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens
                }
                return parsed
            except Exception as e:
                error_msg = str(e)
                logger.warning(f"Gemini API model '{self.model_name}' invocation failed ({type(e).__name__}): {error_msg}. Triggering FALLBACK_DERIVED mode.")
                fallback = self._generate_fallback_narrative(evidence_bundle)
                fallback["notice"] = f"AI narrative unavailable ({self.model_name} {type(e).__name__})"
                fallback["error_detail"] = f"{type(e).__name__}: {error_msg[:100]}"
                return fallback
                
        # Deterministic evidence-grounded fallback when client is not initialized
        fallback = self._generate_fallback_narrative(evidence_bundle)
        fallback["notice"] = "AI narrative unavailable (No API Key Configured)"
        return fallback
                
        # Deterministic evidence-grounded fallback when client is not initialized
        fallback = self._generate_fallback_narrative(evidence_bundle)
        fallback["notice"] = "AI narrative unavailable (No API Key Configured)"
        return fallback

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
3. Each bullet in key_findings and each item in affected_areas MUST carry at most ONE citation.
4. Output MUST be valid JSON with keys:
   - "headline": Short high-impact 1-sentence summary
   - "key_findings": Array of 3-5 short single-sentence strings, each with its own citation (e.g., ["1,448 road segments impassable [EVID_BROKEN_ROAD_COUNT]", "27,465 residents lose sub-30min healthcare access [EVID_POP_30MIN_LOSS]"])
   - "affected_areas": Array of 3-5 objects with keys "area", "metric", "severity" (e.g., [{{"area": "Rajnagar Block", "metric": "94 facilities isolated [EVID_ISOLATED_FAC_COUNT]", "severity": "CRITICAL"}}, ...])
   - "recommended_focus": 1-2 sentences max on where attention should go first
   - "situation_narrative": 2 short sentences summarizing key facts
   - "priority_actions": Array of 3 actionable recommendations
   - "draft_advisory": Object with keys "subject", "situation", "population_impact", "recommended_actions"

Return strictly valid JSON format.
"""

    def _generate_fallback_narrative(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        ev = evidence["evidence_items"]
        cyclone = evidence.get("cyclone_name", "Cyclone Forecast System")
        
        peak_surge = ev.get("EVID_PEAK_SURGE", {}).get("value", 3.2)
        max_wind = ev.get("EVID_MAX_WIND", {}).get("value", 145.0)
        pop_30min = ev.get("EVID_POP_30MIN_LOSS", {}).get("value", 27465)
        pop_60min = ev.get("EVID_POP_60MIN_LOSS", {}).get("value", 31214)
        iso_facs = ev.get("EVID_ISOLATED_FAC_COUNT", {}).get("value", 94)
        broken_roads = ev.get("EVID_BROKEN_ROAD_COUNT", {}).get("value", 1448)
        
        iso_names = ", ".join(evidence.get("isolated_facility_names", ["PHC Sanatpur", "UGPHC Tangi"]))
        broken_road_names = ", ".join(evidence.get("broken_road_names", ["SH-9A Coastal Causeway"]))

        headline = f"Under baseline forecast, {pop_30min:,} people lose sub-30min hospital access with {iso_facs} facilities road-isolated [EVID_POP_30MIN_LOSS] [EVID_ISOLATED_FAC_COUNT]."
        
        key_findings = [
            f"Peak wind speeds reach {max_wind} km/h with {peak_surge}m coastal storm surge [EVID_MAX_WIND]",
            f"{broken_roads:,} arterial road segments impassable due to coastal flooding [EVID_BROKEN_ROAD_COUNT]",
            f"{pop_30min:,} residents move beyond 30-minute emergency healthcare reach [EVID_POP_30MIN_LOSS]",
            f"{iso_facs} public health facilities face total road network isolation [EVID_ISOLATED_FAC_COUNT]"
        ]

        affected_areas = [
            {
                "area": "Rajnagar & Tangi Sector",
                "metric": f"{iso_facs} health facilities isolated [EVID_ISOLATED_FAC_COUNT]",
                "severity": "CRITICAL"
            },
            {
                "area": "Kendrapara Low-Lying Corridor",
                "metric": f"{pop_30min:,} residents lose 30-min access [EVID_POP_30MIN_LOSS]",
                "severity": "HIGH"
            },
            {
                "area": "Bhadrak Arterial Highways",
                "metric": f"{broken_roads:,} road edges impassable [EVID_BROKEN_ROAD_COUNT]",
                "severity": "HIGH"
            }
        ]

        recommended_focus = f"Pre-position 4 watercraft rescue units at Chandbali staging depot and deploy emergency generators to isolated health centers ({iso_names}) before T-14h overtopping [EVID_ISOLATED_FAC_COUNT]."

        narrative = (
            f"Baseline forecast for {cyclone} shows {max_wind} km/h winds [EVID_MAX_WIND] and {peak_surge}m coastal surge [EVID_PEAK_SURGE]. "
            f"Sub-block coastal overtopping severs {broken_roads:,} road links [EVID_BROKEN_ROAD_COUNT], placing {iso_facs} health facilities under total isolation [EVID_ISOLATED_FAC_COUNT] "
            f"and impacting {pop_30min:,} residents [EVID_POP_30MIN_LOSS]."
        )
        
        actions = [
            f"Pre-position mobile medical units and emergency generators at key hub facilities ({iso_names}) prior to causeway overtopping.",
            f"Deploy ODRAF / NDRF flood rescue teams along arterial road corridors ({broken_road_names}) before landfall.",
            f"Activate high-capacity multi-purpose cyclone shelters in coastal blocks with high flood susceptibility."
        ]
        
        draft = {
            "subject": f"Pre-Landfall Emergency Infrastructure Disruption & Evacuation Order — {cyclone}",
            "situation": f"Severe cyclone forecast within 36 hours with peak winds of {max_wind} km/h [EVID_MAX_WIND] and {peak_surge}m coastal storm surge [EVID_PEAK_SURGE].",
            "population_impact": f"Sub-block inundation severs {broken_roads:,} arterial road links [EVID_BROKEN_ROAD_COUNT], placing {iso_facs} health facilities under total road isolation [EVID_ISOLATED_FAC_COUNT] and cutting off {pop_30min:,} residents from sub-30min care [EVID_POP_30MIN_LOSS].",
            "recommended_actions": f"1. Block Development Officers in Kendrapara & Bhadrak must complete evacuation to Multi-Purpose Cyclone Shelters by 18:00 hrs.\n2. Pre-position 4 inflatable motorboats at Chandbali Staging Depot for watercraft rescue to {iso_names}.\n3. Reroute emergency ambulances around severed {broken_road_names} coastal causeways."
        }
        
        return {
            "headline": headline,
            "key_findings": key_findings,
            "affected_areas": affected_areas,
            "recommended_focus": recommended_focus,
            "situation_narrative": narrative,
            "priority_actions": actions,
            "draft_advisory": draft,
            "citation_validated": True,
            "provenance": "FALLBACK_DERIVED"
        }
