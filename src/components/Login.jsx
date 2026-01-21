import React, { useState } from 'react';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';

export const Login = () => {
    const { login } = useAuditStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (email === 'tester@gmail.com' && password === 'Tester@123') {
            login({
                email,
                username: 'Tester'
            });
        } else {
            alert('Invalid credentials. Please use tester@gmail.com and password as Tester@123');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-lg mb-4">
                        <ShieldCheck className="w-12 h-12 text-indigo-600 fill-indigo-50" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                        WCAG Auditor
                    </h1>
                    <p className="text-slate-600 text-sm">
                        Professional Accessibility Compliance Platform
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Email Address
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="auditor@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                            For demo purposes, use any email address
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
