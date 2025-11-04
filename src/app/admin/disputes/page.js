'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminListDisputes, adminGetDispute, adminUpdateDisputeStatus, adminPostDisputeMessage, adminAssignDispute } from '@/lib/api/disputes';
import CircleSpinner from '@/components/CircleSpinner';

export default function AdminDisputesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', q: '' });
  const [active, setActive] = useState(null); // { dispute, messages }
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');

  const load = useCallback(async () => {
  try {
  setLoading(true);
  const rows = await adminListDisputes(filters);
  setList(rows || []);
  } catch (e) {
  setList([]);
  } finally {
  setLoading(false);
  }
  }, [filters]);
  
  useEffect(() => { load(); }, [load]);

  const openDispute = async (id) => {
    try {
      const data = await adminGetDispute(id);
      setActive(data);
    } catch {}
  };

  const updateStatus = async (status) => {
    if (!active?.dispute) return;
    try {
      await adminUpdateDisputeStatus(active.dispute.id, { status });
      await openDispute(active.dispute.id);
      load();
    } catch {}
  };

  const assignMe = async () => {
    if (!active?.dispute) return;
    try { await adminAssignDispute(active.dispute.id); await openDispute(active.dispute.id); } catch {}
  };

  const send = async () => {
    if (!active?.dispute) return;
    try {
      setSending(true);
      await adminPostDisputeMessage(active.dispute.id, { message: reply });
      setReply('');
      await openDispute(active.dispute.id);
    } catch {} finally { setSending(false); }
  };

  return (
    <main className="flex-1 p-2">
      <h1 className="text-xl font-semibold text-green-700 mb-3">Dispute Management</h1>

      <div className="bg-white rounded shadow p-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className="border rounded px-3 py-2 text-sm text-gray-800 bg-white" value={filters.status} onChange={(e)=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="awaiting_user">Awaiting User</option>
            <option value="awaiting_producer">Awaiting Producer</option>
            <option value="resolved">Resolved</option>
            <option value="refunded">Refunded</option>
            <option value="rejected">Rejected</option>
          </select>
          <input className="border rounded px-3 py-2 text-sm text-gray-800 bg-white" placeholder="Search reason..." value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow min-h-[60vh]">
          <div className="px-3 py-2 text-xs font-semibold text-gray-600 border-b">Disputes</div>
          {loading ? (
            <div className="flex justify-center py-8"><CircleSpinner size={40} /></div>
          ) : list.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">No disputes found.</div>
          ) : (
            <div className="divide-y">
              {list.map(d => (
              <button key={d.id} onClick={()=>openDispute(d.id)} className="w-full text-left px-3 py-3 hover:bg-gray-50">
              <div className="flex justify-between text-sm">
              <div className="font-semibold text-gray-800">#{d.id} • {d.reason}</div>
              <div className="text-xs text-gray-500">Order #{d.orderId} • {new Date(d.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xs text-gray-600">Status: {d.status}</div>
              </button>
              ))}
              </div>
          )}
        </div>

        <div className="bg-white rounded shadow min-h-[60vh]">
          {!active ? (
            <div className="text-center text-gray-500 py-10 text-sm">Select a dispute to view details</div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2 border-b text-sm font-semibold text-gray-700">Dispute #{active.dispute.id}</div>
              <div className="p-3 text-sm text-gray-700">
                <div className="mb-2"><span className="font-medium">Reason:</span> {active.dispute.reason}</div>
                <div className="mb-2"><span className="font-medium">Status:</span> {active.dispute.status}</div>
                {active.dispute.assignedAdminId ? (
                  <div className="mb-2 text-xs text-gray-600">Assigned to admin #{active.dispute.assignedAdminId}</div>
                ) : (
                  <button onClick={assignMe} className="text-xs text-blue-600 underline">Assign to me</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {(active.messages || []).map((m,i) => (
                  <div key={i} className="text-sm">
                    <div className="text-xs text-gray-500">{m.senderRole} • {new Date(m.createdAt).toLocaleString()}</div>
                    {m.message && <div className="text-gray-800">{m.message}</div>}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t space-y-2">
                <div className="flex gap-2">
                  <select className="border rounded px-2 py-1 text-xs text-gray-800" onChange={(e)=>updateStatus(e.target.value)} defaultValue="">
                    <option value="" disabled>Update Status…</option>
                    <option value="under_review">Under Review</option>
                    <option value="awaiting_user">Awaiting User</option>
                    <option value="awaiting_producer">Awaiting Producer</option>
                    <option value="resolved">Resolved</option>
                    <option value="refunded">Refunded</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input value={reply} onChange={(e)=>setReply(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm text-gray-800" placeholder="Write a reply…" />
                  <button disabled={sending} onClick={send} className="px-3 py-1 bg-green-600 text-white rounded text-sm">{sending ? 'Sending…' : 'Send'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
