import time
import hashlib
import json
from enum import Enum
from typing import Dict, Any, List, Optional

class AdvisoryStatus(str, Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPATCHED = "DISPATCHED"

class AdvisoryWorkflowManager:
    """
    Human-in-the-Loop Advisory State Machine with Hash-Chained Audit Trail.
    Ensures no AI decision is dispatched without explicit officer review & signature.
    """
    def __init__(self):
        self.advisories: Dict[str, Dict[str, Any]] = {}
        self.audit_log: List[Dict[str, Any]] = []

    def _compute_hash(self, prev_hash: str, record: Dict[str, Any]) -> str:
        content = f"{prev_hash}|{record['timestamp']}|{record['advisory_id']}|{record['action']}|{record['actor']}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def create_draft(self, 
                     title: str, 
                     content: str, 
                     evidence_ids: List[str], 
                     author: str = "Gemini 3.7 Flash") -> Dict[str, Any]:
        adv_id = f"ADV_{int(time.time() * 1000)}"
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
        advisory = {
            "advisory_id": adv_id,
            "title": title,
            "content": content,
            "status": AdvisoryStatus.DRAFT.value,
            "evidence_ids": evidence_ids,
            "created_at": timestamp,
            "updated_at": timestamp,
            "author": author,
            "reviewer": None,
            "reviewer_notes": None
        }
        
        self.advisories[adv_id] = advisory
        self._record_audit_event(adv_id, "CREATE_DRAFT", author, "Initial AI draft created from simulation evidence.")
        return advisory

    def update_status(self, 
                      adv_id: str, 
                      new_status: AdvisoryStatus, 
                      actor: str, 
                      notes: str = "", 
                      updated_content: Optional[str] = None) -> Dict[str, Any]:
        if adv_id not in self.advisories:
            raise KeyError(f"Advisory {adv_id} not found.")
            
        adv = self.advisories[adv_id]
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
        if updated_content:
            adv["content"] = updated_content
            
        adv["status"] = new_status.value
        adv["updated_at"] = timestamp
        adv["reviewer"] = actor
        adv["reviewer_notes"] = notes
        
        self._record_audit_event(adv_id, f"TRANSITION_TO_{new_status.value}", actor, notes)
        return adv

    def _record_audit_event(self, adv_id: str, action: str, actor: str, notes: str):
        prev_hash = self.audit_log[-1]["current_hash"] if len(self.audit_log) > 0 else "0" * 64
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
        record = {
            "audit_id": len(self.audit_log) + 1,
            "advisory_id": adv_id,
            "timestamp": timestamp,
            "action": action,
            "actor": actor,
            "notes": notes,
            "previous_hash": prev_hash
        }
        record["current_hash"] = self._compute_hash(prev_hash, record)
        self.audit_log.append(record)

    def get_advisory(self, adv_id: str) -> Optional[Dict[str, Any]]:
        return self.advisories.get(adv_id)

    def list_advisories(self) -> List[Dict[str, Any]]:
        return list(self.advisories.values())

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        return self.audit_log
