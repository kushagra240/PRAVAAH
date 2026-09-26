import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Send, Download, FileCode, ShieldAlert, ArrowRight, Lock, AlertTriangle } from 'lucide-react';

export default function AdvisoryModal({ isOpen, onClose, currentUser = null }) {
  if (!isOpen) return null;

  const [statusStep, setStatusStep] = useState('DRAFT'); // DRAFT, REVIEW, APPROVED, DISPATCHED
  const [advisoryId, setAdvisoryId] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [advisoryTitle, setAdvisoryTitle] = useState('PRE-POSITION RESCUE BOATS AT CHANDBALI & PROTECT SANATPUR / TANGI / RAJNAGAR ACCESS');
  const [advisoryContent, setAdvisoryContent] = useState(
    '1. Pre-position 4 inflatable motorboats at Chandbali Staging Depot before T-14h.\n' +
    '2. Direct watercraft rescue for PHC Sanatpur & UGPHC Tangi under Total Road Isolation.\n' +
    '3. Issue travel caution & delay rerouting alert for CHC Rajnagar feeder routes (+28m delay).'
  );

  const steps = ['DRAFT', 'REVIEW', 'APPROVED', 'DISPATCHED'];

  const handleAdvanceStatus = async () => {
    setRoleError(null);
    let nextStatus = 'REVIEW';
    
    if (statusStep === 'DRAFT') {
      nextStatus = 'REVIEW';
    } else if (statusStep === 'REVIEW') {
      // GATING CHECK (§20): Only users with role 'APPROVER' can approve advisories
      if (currentUser?.role !== 'APPROVER') {
        setRoleError(`Approval Restricted: Only users with the APPROVER role (e.g. R. Mohanty, District Collector) can approve advisories. Active account (${currentUser?.name || 'A. Patnaik'}, ${currentUser?.role || 'ANALYST'}) is restricted.`);
        return;
      }
      nextStatus = 'APPROVED';
    } else if (statusStep === 'APPROVED') {
      nextStatus = 'DISPATCHED';
    }

    try {
      const activeActor = `${currentUser?.name || 'R. Mohanty'} (${currentUser?.title || 'District Collector'})`;
      if (!advisoryId) {
        // 1. Create real draft advisory on backend
        const res = await fetch('/api/v1/advisories/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: advisoryTitle,
            content: advisoryContent,
            evidence_ids: ['EVID_POP_30MIN_LOSS', 'EVID_BROKEN_ROAD_COUNT'],
            author: activeActor
          })
        });
        if (res.ok) {
          const adv = await res.json();
          setAdvisoryId(adv.advisory_id);
          // Advance status
          await fetch(`/api/v1/advisories/${adv.advisory_id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: nextStatus,
              actor: activeActor,
              notes: `Status advanced to ${nextStatus} by ${currentUser?.role || 'User'}`,
              updated_content: advisoryContent
            })
          });
        }
      } else {
        // 2. Update status of existing advisory
        await fetch(`/api/v1/advisories/${advisoryId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: nextStatus,
            actor: activeActor,
            notes: `Status advanced to ${nextStatus} by ${currentUser?.role || 'User'}`,
            updated_content: advisoryContent
          })
        });
      }
    } catch (e) {
      console.error("Advisory API error:", e);
    }

    setStatusStep(nextStatus);
  };

  const downloadCapXml = async () => {
    if (advisoryId) {
      try {
        const res = await fetch(`/api/v1/advisories/${advisoryId}/cap_xml`);
        if (res.ok) {
          const xml = await res.text();
          const blob = new Blob([xml], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `CAP_ADVISORY_${advisoryId}.xml`;
          a.click();
          return;
        }
      } catch (e) {
        console.error("CAP XML fetch error:", e);
      }
    }

    // Fallback client XML download
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${advisoryId || 'PRAVAAH-ADV-2021-0526-01'}</identifier>
  <sender>pravaah.odisha.gov.in</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>${statusStep === 'APPROVED' ? 'Actual' : 'Draft'}</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Safety</category>
    <event>Cyclone Surge & Hospital Isolation</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <headline>${advisoryTitle}</headline>
    <description>${advisoryContent}</description>
    <area>
      <areaDesc>Kendrapara and Bhadrak Coastal Districts</areaDesc>
    </area>
  </info>
</alert>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CAP_ADVISORY_PRAVAAH.xml';
    a.click();
  };

  const isApprovalBlocked = statusStep === 'REVIEW' && currentUser?.role !== 'APPROVER';

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-xl p-5 rounded-lg border border-slate-300 shadow-xl space-y-4 font-sans text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-900" />
            <h3 className="text-base font-bold text-slate-900 font-sans">ACTION ADVISORY & HUMAN APPROVAL</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Pipeline Steps (Prompt #22) */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md border border-slate-200">
          {steps.map((step, idx) => {
            const isCompleted = steps.indexOf(statusStep) >= idx;
            const isCurrent = statusStep === step;
            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isCurrent 
                      ? 'bg-blue-900 text-white shadow-xs' 
                      : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`font-semibold ${isCurrent ? 'text-blue-950 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Role Gating Warning / Error Notice */}
        {roleError && (
          <div className="bg-red-50 border border-red-300 p-3 rounded-md text-xs text-red-900 font-medium flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{roleError}</div>
          </div>
        )}

        {isApprovalBlocked && !roleError && (
          <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-md text-xs text-amber-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>Role Limitation:</strong> Active account is <strong>{currentUser?.name} ({currentUser?.role})</strong>. You may draft/submit for review, but only an <strong>APPROVER</strong> (e.g. R. Mohanty) can sign approval.
            </div>
          </div>
        )}

        {/* Advisory Form with Clear Section Breaks */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Subject Line</label>
            <input 
              type="text" 
              value={advisoryTitle}
              onChange={(e) => setAdvisoryTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 font-semibold text-slate-900 text-xs bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Section 1: Situation Overview</label>
              <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-800 leading-snug">
                Severe cyclone forecast within 36 hours with peak winds of 145.0 km/h <span className="font-mono text-blue-700 font-bold">[EVID_MAX_WIND]</span> and 3.2m coastal storm surge <span className="font-mono text-blue-700 font-bold">[EVID_PEAK_SURGE]</span>.
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Section 2: Population Impact</label>
              <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-800 leading-snug">
                Sub-block inundation severs 1,448 road links <span className="font-mono text-blue-700 font-bold">[EVID_BROKEN_ROAD_COUNT]</span>, isolating 94 health facilities <span className="font-mono text-blue-700 font-bold">[EVID_ISOLATED_FAC_COUNT]</span> and impacting 27,465 residents <span className="font-mono text-blue-700 font-bold">[EVID_POP_30MIN_LOSS]</span>.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Section 3: Directed Operational Orders</label>
            <textarea 
              rows={4}
              value={advisoryContent}
              onChange={(e) => setAdvisoryContent(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-[11px] text-slate-800 leading-relaxed bg-white"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-md text-[11px] text-blue-900 space-y-0.5">
            <div className="font-bold">Human Sign-off & Audit Trail</div>
            <div>Active Signatory: <strong>{currentUser?.name || 'R. Mohanty'} ({currentUser?.title || 'District Office'})</strong></div>
            <div>Accountability Role: <strong className="font-mono">{currentUser?.role || 'APPROVER'}</strong></div>
            <div>Traceability: Directives linked to Evidence EV-ISOLATED-POP-01 & Hydro Model Run.</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <button 
            onClick={downloadCapXml}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CAP XML</span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium">
              Cancel
            </button>
            <button 
              onClick={handleAdvanceStatus}
              disabled={isApprovalBlocked}
              className={`px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                isApprovalBlocked
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-950 text-white'
              }`}
            >
              {isApprovalBlocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Send className="w-3.5 h-3.5" />}
              <span>
                {statusStep === 'DRAFT' 
                  ? 'Submit for Review' 
                  : statusStep === 'REVIEW' 
                  ? (isApprovalBlocked ? 'Approval Restricted (Role Gate)' : 'Approve Advisory') 
                  : statusStep === 'APPROVED' 
                  ? 'Dispatch Alert' 
                  : 'Advisory Dispatched ✓'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
