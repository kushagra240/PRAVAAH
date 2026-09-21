import time
import xml.etree.ElementTree as ET
from typing import Dict, Any

def generate_cap_xml(advisory: Dict[str, Any], cyclone_name: str = "Cyclone Yaas") -> str:
    """
    Generates OASIS Common Alerting Protocol (CAP v1.2) XML payload 
    for official emergency alert distribution systems.
    """
    root = ET.Element("alert", xmlns="urn:oasis:names:tc:emergency:cap:1.2")
    
    ET.SubElement(root, "identifier").text = advisory.get("advisory_id", "ADV_001")
    ET.SubElement(root, "sender").text = advisory.get("author", "PRAVAAH Decision Engine")
    ET.SubElement(root, "sent").text = advisory.get("updated_at", time.strftime("%Y-%m-%dT%H:%M:%SZ"))
    ET.SubElement(root, "status").text = "Actual" if advisory.get("status") == "APPROVED" else "Draft"
    ET.SubElement(root, "msgType").text = "Alert"
    ET.SubElement(root, "scope").text = "Public"
    
    info = ET.SubElement(root, "info")
    ET.SubElement(info, "category").text = "Met"
    ET.SubElement(info, "event").text = f"Severe Tropical Cyclone ({cyclone_name})"
    ET.SubElement(info, "urgency").text = "Immediate"
    ET.SubElement(info, "severity").text = "Severe"
    ET.SubElement(info, "certainty").text = "Observed"
    ET.SubElement(info, "headline").text = advisory.get("title", "Pre-Landfall Evacuation & Action Notice")
    ET.SubElement(info, "description").text = advisory.get("content", "")
    ET.SubElement(info, "web").text = "https://pravaah.gov.in"
    
    area = ET.SubElement(info, "area")
    ET.SubElement(area, "areaDesc").text = "Coastal Odisha (Puri, Jagatsinghpur, Kendrapara, Bhadrak)"
    
    return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
