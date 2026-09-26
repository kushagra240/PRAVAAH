import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle, XCircle, Send, Lock, History } from 'lucide-react';

export default function AdvisoryPanel({ briefData, currentUser = null }) {
  const draftText = briefData?.brief?.draft_advisory || "EMERGENCY CYCLONE ADVISORY — DRAFT IN PROGRESS";
  const evidenceIds = Object.keys(briefData?.evidence_bundle?.evidence_items || {});

  const [advisories, setAdvisories] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [currentAdv, setCurrentAdv] = useState(null);
  const [content, setContent] = useState(draftText);
  const [actor, setActor] = useState(currentUser?.name || 'District Magistrate / Collector');
  const [notes, setNotes] = useState('');
  const [roleNotice, setRoleNotice] = useState(null);

  useEffect(() => {
    fetchAdvisories();
    fetchAuditTrail();
  }, []);

  const fetchAdvisories = async () => {
    try {
      const res = await fetch('/api/v1/advisories');
      const data = await res.json();
      setAdvisories(data);
      if (data.length > 0) {
        setCurrentAdv(data[data.length - 1]);
        setContent(data[data.length - 1].content);
      }
    } catch (e) {
      console.warn("Failed to fetch advisories:", e);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const res = await fetch('/api/v1/advisories/audit');
      const data = await res.json();
      setAuditTrail(data);
    } catch (e) {
      console.warn("Failed to fetch audit trail:", e);
    }
  };

  const handleCreateDraft = async () => {
    try {
      const res = await fetch('/api/v1/advisories/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Pre-Landfall Evacuation & Action Notice",
          content: content,
          evidence_ids: evidenceIds,
          author: "Gemini 3.7 Flash Decision Engine"
        })
      });
      const data = await res.json();
      setCurrentAdv(data);
      fetchAdvisories();
      fetchAuditTrail();
    } catch (e) {
      console.error("Create draft failed:", e);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!currentAdv) return;
    setRoleNotice(null);

    // GATING CHECK (§20): Only users with role 'APPROVER' can approve advisories
    if (status === 'APPROVED' && currentUser?.role !== 'APPROVER') {
      setRoleNotice(`🔒 Approval Restricted: Active account is ${currentUser?.name || 'A. Patnaik'} (${currentUser?.role || 'ANALYST'}). Approval requires an APPROVER role (e.g. R. Mohanty).`);
      return;
    }

    try {
      const activeActor = currentUser ? `${currentUser.name} (${currentUser.title})` : actor;
      const res = await fetch(`/api/v1/advisories/${currentAdv.advisory_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          actor: activeActor,
          notes: notes,
          updated_content: content
        })
      });
      const data = await res.json();
      setCurrentAdv(data);
      setNotes('');
      fetchAdvisories();
      fetchAuditTrail();
    } catch (e) {
      console.error("Status update failed:", e);
    }
  };

  return (
    <div className="h-full flex flex-col p-5 space-y-5 overflow-y-auto bg-[#0B0F19]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-gray-100">Human-in-the-Loop Advisory Review</h2>
            <p className="text-xs text-gray-400">Strict human authorization & append-only audit trail</p>
          </div>
        </div>
      </div>

      {/* Advisory Editor Card */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-gray-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Advisory Draft Editor</span>
          </div>
          {currentAdv && (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
              currentAdv.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
              currentAdv.status === 'DISPATCHED' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
              currentAdv.status === 'REJECTED' ? 'bg-red-950 text-red-400 border-red-800' :
              'bg-orange-950 text-orange-400 border-orange-800'
            }`}>
              {currentAdv.status}
            </span>
          )}
        </div>

        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500"
        />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Authorizing Officer</label>
            <input 
              type="text" 
              value={actor} 
              onChange={(e) => setActor(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-md p-2 text-xs text-gray-200"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Reviewer Notes</label>
            <input 
              type="text" 
              placeholder="Reason for approval / rejection..."
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-md p-2 text-xs text-gray-200"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          {!currentAdv ? (
            <button
              onClick={handleCreateDraft}
              className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-colors"
            >
              Generate Formal Advisory Draft
            </button>
          ) : (
            <>
              <button
                onClick={() => handleUpdateStatus('APPROVED')}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Advisory</span>
              </button>

              <button
                onClick={() => handleUpdateStatus('REJECTED')}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                onClick={() => handleUpdateStatus('DISPATCHED')}
                disabled={currentAdv.status !== 'APPROVED'}
                className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  currentAdv.status === 'APPROVED' 
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500 cursor-pointer' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Warning</span>
              </button>
            </>
          )}
        </div>

        {/* CAP XML Export Button */}
        {currentAdv && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
            <a 
              href={`/api/v1/advisories/${currentAdv.advisory_id}/cap_xml`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center py-1.5 rounded bg-gray-900 border border-gray-800 text-xs font-mono text-cyan-400 hover:text-cyan-300"
            >
              Export OASIS CAP v1.2 XML &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Hash-Chained Audit Trail Inspector */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-gray-200">Cryptographic Hash-Chained Audit Log</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400">{auditTrail.length} records</span>
        </div>

        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {auditTrail.map((record) => (
            <div key={record.audit_id} className="p-2.5 rounded bg-gray-900/80 border border-gray-800/80 text-[11px] space-y-1 font-mono">
              <div className="flex items-center justify-between text-gray-300">
                <span className="font-bold text-cyan-400">#{record.audit_id} {record.action}</span>
                <span className="text-[10px] text-gray-500">{record.timestamp}</span>
              </div>
              <div className="text-gray-400">Actor: {record.actor} | Notes: {record.notes || 'N/A'}</div>
              <div className="text-[10px] text-gray-500 truncate" title={record.current_hash}>
                Hash: {record.current_hash.slice(0, 16)}...
              </div>
            </div>
          ))}

          {auditTrail.length === 0 && (
            <div className="text-center text-xs text-gray-500 py-4">No audit events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
