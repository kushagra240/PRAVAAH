import pytest
import numpy as np
import os
import pandas as pd

from backend.pravaah.engines.cyclone.holland import HollandWindModel
from backend.pravaah.engines.hazard.surge import ParametricSurgeModel
from backend.pravaah.engines.hazard.flood import HeuristicFloodScreeningModel
from backend.pravaah.ai.validator import CitationValidator

def test_holland_wind_field():
    model = HollandWindModel()
    track_fix = {
        "lat": 20.0, "lon": 86.0, "p_c": 950.0, "v_max": 160.0, 
        "r_max": 35.0, "speed_kph": 20.0, "bearing_deg": 310.0
    }
    
    lats = np.array([20.0, 20.3, 22.0])
    lons = np.array([86.0, 86.3, 88.0])
    
    winds = model.compute_wind_field(lats, lons, track_fix)
    assert len(winds) == 3
    assert winds[1] > winds[2] # Near center is stronger than far away

def test_surge_screening():
    model = ParametricSurgeModel()
    surge_peak = model.compute_peak_surge_height(p_c_hpa=950.0, v_max_kph=150.0)
    assert 2.0 <= surge_peak <= 8.0

def test_flood_susceptibility():
    model = HeuristicFloodScreeningModel()
    df_cube = pd.DataFrame([{
        "elev_mean": 2.0, "hand_m": 0.5, "slope_mean": 0.2, 
        "twi": 11.0, "dist_drainage_m": 200.0, "water_occurrence_pct": 10.0
    }])
    
    probs = model.predict_flood_probability(df_cube, rain_24h_mm=300.0, rain_intensity_mmh=40.0)
    assert 0.0 <= probs[0] <= 1.0
    assert probs[0] > 0.5 # High rain + low HAND -> high flood probability

def test_citation_validator():
    validator = CitationValidator()
    evidence_bundle = {
        "evidence_items": {
            "EVID_PEAK_SURGE": {"value": 3.2},
            "EVID_POP_30MIN_LOSS": {"value": 184000}
        }
    }
    
    text_valid = "Peak surge is 3.2m [EVID_PEAK_SURGE] causing 184,000 people to lose access [EVID_POP_30MIN_LOSS]."
    is_valid, cleaned, invalid = validator.validate_narrative(text_valid, evidence_bundle)
    assert is_valid is True
    assert len(invalid) == 0
    
    text_invalid = "Random ungrounded claim [EVID_FAKE_123]."
    is_valid_2, cleaned_2, invalid_2 = validator.validate_narrative(text_invalid, evidence_bundle)
    assert is_valid_2 is False
    assert any("INVALID_ID_EVID_FAKE_123" in item for item in invalid_2)

def test_citation_validator_fabricated_number_rejection():
    validator = CitationValidator()
    evidence_bundle = {
        "evidence_items": {
            "EVID_POP_30MIN_LOSS": {"value": 184000}
        }
    }
    
    # Deliberate test: feed validator a fabricated number (999,000 vs evidence truth 184,000)
    fabricated_narrative = "Over 999,000 people will lose hospital access [EVID_POP_30MIN_LOSS]."
    is_valid, cleaned, invalid = validator.validate_narrative(fabricated_narrative, evidence_bundle)
    
    assert is_valid is False
    assert len(invalid) > 0
    assert any("MISMATCH_NUMERICAL" in item for item in invalid)
