import numpy as np
import pandas as pd
from typing import Dict, Any

class HeuristicFloodScreeningModel:
    """
    Heuristic Flood Screening Model (Placeholder pending trained XGBoost SAR model per §9.4).
    Predicts cell flood probability P(Flood) in [0, 1] based on a calibrated logit formula 
    combining terrain wetness, HAND, surge, and rainfall intensity.
    
    Provenance: ASSUMPTION (Parametric screening heuristic)
    """
    def __init__(self):
        self.provenance_class = "ASSUMPTION"
        self.feature_names = [
            "elev_mean", "hand_m", "slope_mean", "twi", 
            "dist_drainage_m", "water_occurrence_pct", "rain_24h_mm", 
            "rain_intensity_mmh", "surge_depth_m"
        ]
        
    def predict_flood_probability(self, 
                                  df_cube: pd.DataFrame, 
                                  rain_24h_mm: float = 250.0,
                                  rain_intensity_mmh: float = 35.0,
                                  surge_depth_m: np.ndarray = None) -> np.ndarray:
        """
        Computes cell-level flood probability array.
        """
        elev = df_cube["elev_mean"].values
        hand = df_cube["hand_m"].values
        twi = df_cube["twi"].values
        dist_drain = df_cube["dist_drainage_m"].values
        water_occ = df_cube["water_occurrence_pct"].values
        
        if surge_depth_m is None:
            surge_depth_m = np.zeros(len(df_cube))
            
        # Logit calculation combining terrain wetness, HAND, surge, and rainfall intensity
        # Lower HAND, higher TWI, higher surge, higher rainfall -> higher flood probability
        score = (
            - 0.85 * hand
            - 0.40 * np.clip(elev, 0.0, 10.0)
            + 0.25 * (twi - 8.0)
            - 0.001 * dist_drain
            + 0.03 * water_occ
            + 0.012 * (rain_24h_mm - 100.0)
            + 0.04 * (rain_intensity_mmh - 15.0)
            + 1.8 * surge_depth_m
            - 0.5
        )
        
        # Sigmoid activation to produce probability in [0.0, 1.0]
        prob = 1.0 / (1.0 + np.exp(-np.clip(score, -10.0, 10.0)))
        
        # Ensure permanent water bodies always show high probability
        prob = np.where(water_occ > 60.0, np.maximum(0.95, prob), prob)
        return prob
