import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle, Mail, RefreshCw, BarChart2, FileText, User, IndianRupee } from 'lucide-react';
import Comparison from './Comparison';

function RFPDetail({ rfpId, onBack }) {
    const [rfp, setRfp] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    useEffect(() => {
        fetchRFP();
        fetchVendors();
        fetchProposals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfpId]);

    const fetchRFP = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/rfps/${rfpId}`);
            const data = await res.json();
            setRfp(data);
        } catch (error) {
            console.error('Error fetching RFP:', error);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/vendors');
            const data = await res.json();
            setVendors(data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchProposals = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/rfps/${rfpId}/proposals`);
            const data = await res.json();
            setProposals(data);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        }
    };

    const toggleVendor = (id) => {
        if (selectedVendors.includes(id)) {
            setSelectedVendors(selectedVendors.filter(v => v !== id));
        } else {
            setSelectedVendors([...selectedVendors, id]);
        }
    };

    const handleSend = async () => {
        if (selectedVendors.length === 0) return alert('Select at least one vendor');
        setSending(true);
        try {
            const res = await fetch(`http://localhost:5000/api/rfps/${rfpId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorIds: selectedVendors }),
            });
            if (res.ok) {
                alert('RFP Sent Successfully!');
                fetchRFP();
                setSelectedVendors([]);
            } else {
                alert('Failed to send RFP');
            }
        } catch (error) {
            console.error('Error sending RFP:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCheckResponses = async () => {
        setChecking(true);
        try {
            const res = await fetch('http://localhost:5000/api/rfps/check-responses', {
                method: 'POST',
            });
            const data = await res.json();
            alert(data.message);
            if (data.newProposals.length > 0) {
                fetchProposals();
            }
        } catch (error) {
            console.error('Error checking responses:', error);
            alert('Failed to check responses');
        } finally {
            setChecking(false);
        }
    };

    if (showComparison) {
        return <Comparison rfpId={rfpId} onBack={() => setShowComparison(false)} />;
    }

    if (!rfp) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={onBack}
                className="mb-6 text-slate-500 hover:text-primary-600 flex items-center transition-colors"
            >
                <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: RFP Details & Vendors */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 space-y-8"
                >
                    {/* RFP Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">{rfp.title}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rfp.status === 'Sent' ? 'bg-green-100 text-green-800' :
                                    rfp.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {rfp.status || 'Draft'}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center text-slate-500 text-sm mb-1 justify-end">
                                    <Calendar size={14} className="mr-1.5" />
                                    Created: {new Date(rfp.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-slate-900 font-semibold justify-end">
                                    <IndianRupee size={16} className="mr-1 text-slate-400" />
                                    {rfp.budget ? `${rfp.budget.toLocaleString()}` : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Requirements</h3>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <ul className="space-y-3">
                                    {rfp.requirements.items?.map((item, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-slate-700">
                                            <CheckCircle size={16} className="text-primary-500 mr-2 mt-0.5 shrink-0" />
                                            <span>
                                                <span className="font-medium text-slate-900">{item.quantity}x {item.name}</span>
                                                {item.specs && <span className="text-slate-500"> - {item.specs}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500 block text-xs">Deadline</span>
                                        <span className="font-medium text-slate-900">{rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-xs">Payment Terms</span>
                                        <span className="font-medium text-slate-900">{rfp.requirements.paymentTerms || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Invitation Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Invite Vendors</h2>
                            <span className="text-sm text-slate-500">{selectedVendors.length} selected</span>
                        </div>
                        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {vendors.map(vendor => (
                                <label
                                    key={vendor._id}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedVendors.includes(vendor._id)
                                        ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-200'
                                        : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                        checked={selectedVendors.includes(vendor._id)}
                                        onChange={() => toggleVendor(vendor._id)}
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex justify-between">
                                            <span className={`block text-sm font-medium ${selectedVendors.includes(vendor._id) ? 'text-primary-900' : 'text-slate-900'}`}>
                                                {vendor.name}
                                            </span>
                                            <span className="text-xs text-slate-400">{vendor.tags.slice(0, 2).join(', ')}</span>
                                        </div>
                                        <span className="block text-xs text-slate-500">{vendor.email}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSend}
                                disabled={sending || selectedVendors.length === 0}
                                className={`px-4 py-2 rounded-lg text-black font-medium text-sm flex items-center shadow-sm transition-all ${sending || selectedVendors.length === 0

                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-md'
                                    }`}
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={16} className="mr-2" /> Send Invites
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Proposals & Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={handleCheckResponses}
                                disabled={checking}
                                className={`w-full px-4 py-2.5 rounded-lg text-black font-medium text-sm flex justify-center items-center shadow-sm transition-all ${checking

                                    ? 'bg-slate-400 cursor-wait'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow'
                                    }`}
                            >
                                {checking ? (
                                    <><RefreshCw size={16} className="mr-2 animate-spin" /> Checking Inbox...</>
                                ) : (
                                    <><RefreshCw size={16} className="mr-2" /> Check for Responses</>
                                )}
                            </button>

                            {proposals.length > 0 && (
                                <button
                                    onClick={() => setShowComparison(true)}
                                    className="w-full px-4 py-2.5 rounded-lg text-black font-medium text-sm bg-emerald-600 hover:bg-emerald-700 flex justify-center items-center shadow-sm hover:shadow transition-all"

                                >
                                    <BarChart2 size={16} className="mr-2" /> Compare Proposals
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-3 text-center">
                            Last checked: {new Date().toLocaleTimeString()}
                        </p>
                    </div>

                    {/* Proposals List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Proposals</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                                {proposals.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {proposals.map(proposal => (
                                <div key={proposal._id} className="border border-slate-200 rounded-lg p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-2">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-semibold text-slate-900">{proposal.vendor?.name || 'Unknown'}</span>
                                                <span className="block text-xs text-slate-500">{new Date(proposal.receivedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">
                                            ${proposal.parsedData?.totalCost?.toLocaleString() || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-start">
                                            <FileText size={14} className="text-slate-400 mr-2 mt-0.5 shrink-0" />
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {proposal.analysis || 'No analysis available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {proposals.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Mail size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-500">No proposals received yet.</p>
                                    <p className="text-xs text-slate-400 mt-1">Send invites to vendors to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default RFPDetail;
