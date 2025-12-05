import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Check, X, TrendingUp, DollarSign, Clock, Shield } from 'lucide-react';

function Comparison({ rfpId, onBack }) {
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComparison();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfpId]);

    const fetchComparison = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/rfps/${rfpId}/compare`, {
                method: 'POST',
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch comparison');
            }
            const data = await res.json();
            setComparison(data);
        } catch (error) {
            alert(error.message);
            onBack();
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-slate-600">Generating AI Comparison...</p>
            <p className="text-sm text-slate-400 mt-2">Analyzing costs, timelines, and terms</p>
        </div>
    );

    if (!comparison) return null;

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={onBack}
                className="mb-6 text-slate-500 hover:text-primary-600 flex items-center transition-colors"
            >
                <ArrowLeft size={18} className="mr-1" /> Back to RFP
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Proposal Comparison</h1>
                <p className="text-slate-500 mt-1">AI-powered analysis of vendor responses</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-8 rounded-2xl shadow-sm mb-10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                            <Award size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-indigo-900">AI Recommendation</h2>
                    </div>
                    <p className="text-indigo-900 text-lg font-medium leading-relaxed mb-3">
                        {comparison.recommendation}
                    </p>
                    <p className="text-indigo-700/80 leading-relaxed">
                        {comparison.summary}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Feature</th>
                                {comparison.matrix.map((vendor, idx) => (
                                    <th key={idx} className="px-6 py-4 text-left w-1/4">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-slate-900 mb-1">{vendor.vendor}</span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${vendor.score >= 8 ? 'bg-green-100 text-green-800' :
                                                vendor.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                Score: {vendor.score}/100
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center font-medium text-slate-900">
                                        <DollarSign size={16} className="mr-2 text-slate-400" />
                                        Total Cost
                                    </div>
                                </td>
                                {comparison.matrix.map((vendor, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                        ${vendor.totalCost?.toLocaleString() || 'N/A'}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center font-medium text-slate-900">
                                        <Clock size={16} className="mr-2 text-slate-400" />
                                        Delivery Time
                                    </div>
                                </td>
                                {comparison.matrix.map((vendor, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        {vendor.delivery}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center font-medium text-slate-900">
                                        <Shield size={16} className="mr-2 text-slate-400" />
                                        Warranty
                                    </div>
                                </td>
                                {comparison.matrix.map((vendor, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        {vendor.warranty}
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap align-top pt-6">
                                    <div className="flex items-center font-medium text-slate-900">
                                        <TrendingUp size={16} className="mr-2 text-green-500" />
                                        Pros
                                    </div>
                                </td>
                                {comparison.matrix.map((vendor, idx) => (
                                    <td key={idx} className="px-6 py-4 align-top">
                                        <ul className="space-y-2">
                                            {vendor.pros?.map((pro, i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-600">
                                                    <Check size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>{pro}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap align-top pt-6">
                                    <div className="flex items-center font-medium text-slate-900">
                                        <TrendingUp size={16} className="mr-2 text-red-500 transform rotate-180" />
                                        Cons
                                    </div>
                                </td>
                                {comparison.matrix.map((vendor, idx) => (
                                    <td key={idx} className="px-6 py-4 align-top">
                                        <ul className="space-y-2">
                                            {vendor.cons?.map((con, i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-600">
                                                    <X size={14} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>{con}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

export default Comparison;
