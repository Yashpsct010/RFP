import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Save, X, FileText, CheckCircle } from 'lucide-react';

function CreateRFP() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [structuredData, setStructuredData] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/rfps/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input }),
            });
            const data = await response.json();
            setStructuredData(data);
        } catch (error) {
            console.error('Error generating RFP:', error);
            alert('Failed to generate RFP');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/rfps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: structuredData.title,
                    description: input,
                    requirements: structuredData,
                    budget: structuredData.budget,
                    deadline: structuredData.deadline,
                }),
            });
            if (response.ok) {
                alert('RFP Saved Successfully!');
                setStructuredData(null);
                setInput('');
            } else {
                alert('Failed to save RFP');
            }
        } catch (error) {
            console.error('Error saving RFP:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Create New RFP</h1>
                <p className="text-slate-500 mt-1">Use AI to generate a structured request from your description</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit"
                >
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Describe your procurement needs
                    </label>
                    <textarea
                        className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400 bg-slate-50"
                        placeholder="E.g., I need 20 high-performance laptops for our engineering team. They should have at least 32GB RAM, 1TB SSD, and dedicated graphics. We also need 20 27-inch 4K monitors. Budget is around $50,000 and we need them delivered within 30 days."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !input}
                            className={`px-6 py-2.5 rounded-lg text-black font-medium flex items-center shadow-sm transition-all ${loading || !input
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-md'
                                }`}
                        >
                            <Wand2 size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Analyzing...' : 'Generate Draft'}
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    {structuredData ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-green-50 border-b border-green-100 p-4 flex items-center text-green-800">
                                <CheckCircle size={20} className="mr-2" />
                                <span className="font-medium">Draft Generated Successfully</span>
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-slate-900 mb-4">{structuredData.title}</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Budget</span>
                                        <span className="font-medium text-slate-900">{structuredData.budget ? `$${structuredData.budget.toLocaleString()}` : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Deadline</span>
                                        <span className="font-medium text-slate-900">{structuredData.deadline ? new Date(structuredData.deadline).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Items Required</h3>
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                        {structuredData.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-start">
                                                <div className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-600 mr-3 mt-0.5">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                    {item.specs && <p className="text-xs text-slate-500 mt-0.5">{item.specs}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setStructuredData(null)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                    >
                                        <Save size={18} className="mr-2" />
                                        Save RFP
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <p className="font-medium">AI Preview Area</p>
                            <p className="text-sm mt-1 max-w-xs">Enter your requirements on the left to see the structured RFP here.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default CreateRFP;
