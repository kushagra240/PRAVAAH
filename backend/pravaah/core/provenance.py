from enum import Enum

class ProvenanceClass(str, Enum):
    OBSERVED = "OBSERVED"      # Measured/recorded by authoritative source
    FORECAST = "FORECAST"      # Predicted by external model (e.g., IMD track)
    DERIVED = "DERIVED"        # Computed by PRAVAAH via deterministic equation
    MODELLED = "MODELLED"      # Output of statistical ML model (e.g., XGBoost flood)
    SIMULATED = "SIMULATED"    # User-perturbed scenario parameter
    PLACEHOLDER = "PLACEHOLDER"# Explicit stand-in when data unavailable

class DataProvenance:
    def __init__(self, provenance_class: ProvenanceClass, source: str, description: str = ""):
        self.provenance_class = provenance_class
        self.source = source
        self.description = description

    def to_dict(self):
        return {
            "provenance_class": self.provenance_class.value,
            "source": self.source,
            "description": self.description
        }
