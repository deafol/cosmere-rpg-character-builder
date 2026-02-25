import React from 'react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#051435] flex items-center justify-center p-4 overflow-hidden relative font-lato">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2563eb] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3b82f6] rounded-full blur-[150px] opacity-10 animate-pulse delay-700"></div>

            <div className="max-w-2xl w-full relative z-10 text-center">
                {/* Shard-like Icon / Graphic */}
                <div className="mb-8 inline-block relative">
                    <div className="w-24 h-24 border-2 border-[#d4af37] rotate-45 flex items-center justify-center relative bg-[#0a1e45] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <span className="text-4xl text-[#d4af37] -rotate-45 font-cinzel">ᚱ</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#d4af37] rounded-full animate-ping"></div>
                </div>

                <h1 className="text-5xl md:text-7xl font-cinzel text-white mb-6 tracking-widest drop-shadow-lg">
                    Highstorm <span className="text-[#d4af37]">Approaching</span>
                </h1>

                <p className="text-[#a5b4fc] text-xl md:text-2xl mb-12 leading-relaxed max-w-xl mx-auto font-light">
                    The Cosmere Character Builder is currently seeking shelter. We are performing essential soulcasting to improve your experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Status', value: 'Maintaining Ideals', color: '#d4af37' },
                        { label: 'Estimated Time', value: 'Few Heartbeats', color: '#60a5fa' },
                        { label: 'Safety', value: 'Sphere-lit', color: '#10b981' },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl transition-transform hover:scale-105"
                        >
                            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{item.label}</p>
                            <p className="text-lg font-cinzel text-white" style={{ color: item.color }}>{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-white/40 text-sm tracking-widest uppercase italic">
                        I will protect even those I hate, so long as it is right.
                    </p>
                    <div className="w-48 h-1 bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
                </div>
            </div>

            {/* Subtle Bottom Glow */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#d4af37]/20 font-cinzel text-8xl pointer-events-none select-none">
                
            </div>
        </div>
    );
}
