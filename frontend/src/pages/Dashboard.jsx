import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Users, ArrowRight, Plus } from 'lucide-react';
import RFPDetail from './RFPDetail';

function Dashboard({ onCreateNew }) {
    const [rfps, setRfps] = useState([]);
    const [selectedRfpId, setSelectedRfpId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRFPs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/rfps');
                const data = await res.json();
                setRfps(data);
            } catch (error) {
                console.error('Error fetching RFPs:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!selectedRfpId) {
            fetchRFPs();
        }
    }, [selectedRfpId]);

    if (selectedRfpId) {
        return <RFPDetail rfpId={selectedRfpId} onBack={() => setSelectedRfpId(null)} />;
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your procurement requests</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="bg-white hover:bg-primary-700 text-gray-500 font-bold cursor-pointer hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    New RFP
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {rfps.map(rfp => (
                        <motion.div
                            key={rfp._id}
                            variants={item}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                            onClick={() => setSelectedRfpId(rfp._id)}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                        <FileText size={24} />
                                    </div>
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${rfp.status === 'Sent'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {rfp.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                    {rfp.title}
                                </h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                                    {rfp.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm text-slate-500">
                                    <div className="flex items-center">
                                        <Calendar size={14} className="mr-1.5" />
                                        {new Date(rfp.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <Users size={14} className="mr-1.5" />
                                        {rfp.vendors?.length || 0}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {rfps.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No RFPs yet</h3>
                            <p className="text-slate-500 mt-1">Create your first request for proposal to get started.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default Dashboard;
