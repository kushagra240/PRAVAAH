import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Send, Download, FileCode, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AdvisoryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [statusStep, setStatusStep] = useState('DRAFT'); // DRAFT, REVIEW, APPROVED, DISPATCHED
  const [advisoryId, setAdvisoryId] = useState(null);
  const [advisoryTitle, setAdvisoryTitle] = useState('PRE-POSITION RESCUE BOATS AT CHANDBALI & PROTECT SANATPUR / TANGI / RAJNAGAR ACCESS');
  const [advisoryContent, setAdvisoryContent] = useState(
    '1. Pre-position 4 inflatable motorboats at Chandbali Staging Depot before T-14h.\n' +
    '2. Direct watercraft rescue for PHC Sanatpur & UGPHC Tangi under Total Road Isolation.\n' +
    '3. Issue travel caution & delay rerouting alert for CHC Rajnagar feeder routes (+28m delay).'
  );

  const steps = ['DRAFT', 'REVIEW', 'APPROVED', 'DISPATCHED'];

  const handleAdvanceStatus = async () => {
    let nextStatus = 'REVIEW';
    if (statusStep === 'DRAFT') nextStatus = 'REVIEW';
    else if (statusStep === 'REVIEW') nextStatus = 'APPROVED';
    else if (statusStep === 'APPROVED') nextStatus = 'DISPATCHED';

    try {
      if (!advisoryId) {
        // 1. Create real draft advisory on backend
        const res = await fetch('/api/v1/advisories/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: advisoryTitle,
            content: advisoryContent,
            evidence_ids: ['EVID_POP_30MIN_LOSS', 'EVID_BROKEN_ROAD_COUNT'],
            author: 'District Collector Officer'
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
              actor: 'District Magistrate',
              notes: `Status advanced to ${nextStatus}`,
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
            actor: 'District Magistrate',
            notes: `Status advanced to ${nextStatus}`,
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

        {/* Advisory Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Advisory Headline</label>
            <input 
              type="text" 
              value={advisoryTitle}
              onChange={(e) => setAdvisoryTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-600 font-semibold text-slate-900 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Directives & Operational Orders</label>
            <textarea 
              rows={4}
              value={advisoryContent}
              onChange={(e) => setAdvisoryContent(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-[11px] text-slate-800 leading-relaxed"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-[11px] text-blue-900 space-y-1">
            <div className="font-bold">Human Sign-off & Audit Trail</div>
            <div>Actor: <strong>R. Mohanty (District Collector Office)</strong></div>
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
              className="px-4 py-1.5 rounded bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {statusStep === 'DRAFT' ? 'Submit for Review' : statusStep === 'REVIEW' ? 'Approve Advisory' : statusStep === 'APPROVED' ? 'Dispatch Alert' : 'Advisory Dispatched ✓'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
