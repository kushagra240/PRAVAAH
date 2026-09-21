from typing import Dict, Any, List

class EvidenceBuilder:
    """
    Constructs a structured, typed EvidenceBundle from simulation outputs.
    Assigns explicit evidence_id tokens to all numerical facts to enable strict machine citation.
    """
    def build_evidence_bundle(self, sim_output: Dict[str, Any], cyclone_name: str = "Cyclone Yaas") -> Dict[str, Any]:
        exposure = sim_output.get("exposure", {})
        cascade = sim_output.get("cascade", {})
        blocks = exposure.get("block_breakdown", [])
        
        evidence_items = {}
        
        # Headline physical impact evidence items
        evidence_items["EVID_PEAK_SURGE"] = {
            "id": "EVID_PEAK_SURGE",
            "metric": "Peak Coastal Surge Height",
            "value": sim_output.get("peak_surge_m", 0.0),
            "unit": "meters",
            "provenance": sim_output.get("provenance", "MODELLED")
        }
        
        evidence_items["EVID_MAX_WIND"] = {
            "id": "EVID_MAX_WIND",
            "metric": "Maximum 10m Wind Speed",
            "value": sim_output.get("max_wind_kph", 0.0),
            "unit": "km/h",
            "provenance": sim_output.get("provenance", "MODELLED")
        }
        
        evidence_items["EVID_POP_30MIN_LOSS"] = {
            "id": "EVID_POP_30MIN_LOSS",
            "metric": "Population Losing Sub-30min Hospital Access",
            "value": cascade.get("population_losing_30min_access", 0),
            "unit": "people",
            "provenance": "DERIVED"
        }
        
        evidence_items["EVID_POP_60MIN_LOSS"] = {
            "id": "EVID_POP_60MIN_LOSS",
            "metric": "Population Losing Sub-60min Hospital Access",
            "value": cascade.get("population_losing_60min_access", 0),
            "unit": "people",
            "provenance": "DERIVED"
        }
        
        evidence_items["EVID_ISOLATED_FAC_COUNT"] = {
            "id": "EVID_ISOLATED_FAC_COUNT",
            "metric": "Health Facilities Completely Road-Isolated",
            "value": cascade.get("isolated_facilities_count", 0),
            "unit": "facilities",
            "provenance": "DERIVED"
        }
        
        evidence_items["EVID_BROKEN_ROAD_COUNT"] = {
            "id": "EVID_BROKEN_ROAD_COUNT",
            "metric": "Arterial Road Segments Flooded or Overtopped",
            "value": cascade.get("broken_road_edges_count", 0),
            "unit": "road segments",
            "provenance": "DERIVED"
        }
        
        evidence_items["EVID_POP_FLOOD_EXPOSED"] = {
            "id": "EVID_POP_FLOOD_EXPOSED",
            "metric": "Total Population exposed to High Flood Probability (P >= 0.5)",
            "value": exposure.get("pop_exposed_high_flood", 0),
            "unit": "people",
            "provenance": "MODELLED"
        }

        # Block specific evidence items
        for b in blocks[:5]: # Top 5 vulnerable blocks
            b_id = f"EVID_BLOCK_{b['block'].upper().replace(' ', '_')}"
            evidence_items[b_id] = {
                "id": b_id,
                "metric": f"Flood Exposed Population in Block {b['block']}",
                "value": b["exposed_flood_pop"],
                "unit": "people",
                "provenance": "MODELLED"
            }
            
        return {
            "cyclone_name": cyclone_name,
            "evidence_items": evidence_items,
            "isolated_facility_names": cascade.get("isolated_facility_names", []),
            "broken_road_names": [r["name"] for r in cascade.get("broken_road_edges", [])[:5]]
        }
