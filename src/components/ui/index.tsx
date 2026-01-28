import { LucideIcon } from "lucide-react";
import React, { InputHTMLAttributes, SelectHTMLAttributes, useState } from "react";
export { Modal, NotificationModal } from './Modal';


export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    return (
        <input
            ref={ref}
            className={`border-b-2 border-cosmere-gold/50 bg-cosmere-parchment px-4 py-2 w-full focus:outline-none focus:border-cosmere-gold focus:bg-white transition-all placeholder:text-stone-400 font-ui text-cosmere-blue shadow-sm ${props.className || ''}`}
            {...props}
        />
    );
});
Input.displayName = "Input";

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={`block text-xs font-bold text-cosmere-blue uppercase tracking-widest mb-1 font-ui px-1 ${className || ''}`}>
        {children}
    </label>
);

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => {
    return (
        <select
            ref={ref}
            className={`border-b-2 border-cosmere-gold/50 bg-cosmere-parchment px-4 py-2 w-full focus:outline-none focus:border-cosmere-gold focus:bg-white transition-all placeholder:text-stone-400 font-ui text-cosmere-blue shadow-sm ${props.className || ''}`}
            {...props}
        />
    );
});
Select.displayName = "Select";

export const DividerDecoration = ({ className }: { className?: string }) => (
    <div className={`relative h-6 my-6 flex items-center justify-center ${className}`}>
        <div className="h-[2px] w-full max-w-md bg-gradient-to-r from-transparent via-cosmere-gold to-transparent opacity-80"></div>
        <div className="absolute w-2 h-2 rotate-45 bg-cosmere-gold border border-cosmere-parchment shadow-sm"></div>
    </div>
);

export const FrameDecoration = () => (
    <div className="absolute inset-0 z-0 pointer-events-none text-[#C59D56] opacity-30 select-none mix-blend-multiply">
        {/* Borders */}
        <div className="absolute top-2 left-8 right-8 h-[1px] bg-current opacity-50"></div>
        <div className="absolute bottom-2 left-8 right-8 h-[1px] bg-current opacity-50"></div>
        <div className="absolute left-2 top-8 bottom-8 w-[1px] bg-current opacity-50"></div>
        <div className="absolute right-2 top-8 bottom-8 w-[1px] bg-current opacity-50"></div>

        {/* Corners */}
        <svg className="absolute top-2 left-2 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 23V8C1 4.13401 4.13401 1 8 1H23" strokeWidth="1.5" />
            <path d="M5 23V8C5 6.34315 6.34315 5 8 5H23" strokeWidth="0.5" opacity="0.6" />
        </svg>
        <svg className="absolute top-2 right-2 w-6 h-6 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 23V8C1 4.13401 4.13401 1 8 1H23" strokeWidth="1.5" />
            <path d="M5 23V8C5 6.34315 6.34315 5 8 5H23" strokeWidth="0.5" opacity="0.6" />
        </svg>
        <svg className="absolute bottom-2 right-2 w-6 h-6 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 23V8C1 4.13401 4.13401 1 8 1H23" strokeWidth="1.5" />
            <path d="M5 23V8C5 6.34315 6.34315 5 8 5H23" strokeWidth="0.5" opacity="0.6" />
        </svg>
        <svg className="absolute bottom-2 left-2 w-6 h-6 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 23V8C1 4.13401 4.13401 1 8 1H23" strokeWidth="1.5" />
            <path d="M5 23V8C5 6.34315 6.34315 5 8 5H23" strokeWidth="0.5" opacity="0.6" />
        </svg>
    </div>
);

export const CollapsiblePanel = ({ title, icon, children, defaultOpen = false, forceOpen }: { title: string, icon?: LucideIcon | string, children: React.ReactNode, defaultOpen?: boolean, forceOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Respond to forceOpen prop
    React.useEffect(() => {
        if (forceOpen) {
            setIsOpen(true);
        }
    }, [forceOpen]);

    // Determine how to render the icon
    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            // Using img tag for dynamic icon paths - Next.js Image requires known dimensions
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={icon} alt="" className="w-8 h-8 mr-3 object-contain" />;
        }
        const IconComponent = icon;
        return <IconComponent className="w-6 h-6 mr-2" />;
    };

    return (
        <div className="relative group mb-8">
            <div className="relative rounded-lg overflow-hidden bg-cosmere-parchment shadow-lg transition-all hover:shadow-xl">

                {/* Header */}
                <button
                    className={`w-full relative p-6 transition-all duration-300 overflow-hidden group/btn flex items-center justify-center
                        ${isOpen ? 'text-cosmere-blue bg-cosmere-gold hover:bg-cosmere-blue-hover hover:text-cosmere-gold' : 'text-cosmere-gold bg-cosmere-blue hover:bg-cosmere-blue-hover'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-[0.15em] text-center drop-shadow-sm mt-1 pl-4 pr-4">
                        <div className="flex items-center justify-center">
                            {renderIcon()}
                            {title}
                        </div>
                    </h3>

                    {/* Expand/Collapse Arrow */}
                    <span className={`absolute right-6 top-1/2 -translate-y-1/2 transform transition-transform duration-300 ${isOpen ? 'text-cosmere-blue/50 rotate-180' : 'text-cosmere-gold/50'}`}>
                        ▼
                    </span>

                    {/* Bottom Border */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cosmere-gold to-transparent opacity-70"></div>
                </button>

                {/* Content Area */}
                <div className={`overflow-hidden bg-[#fdfaf5] relative ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <DividerDecoration />
                    {/* Frame Background (Vector) */}
                    <FrameDecoration />

                    {isOpen && (
                        <div>
                            <div className="p-8 relative z-10">
                                {children}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const NumberControl = ({ value, onChange, min = 0, editable = false }: { value: number, onChange: (val: number) => void, min?: number, editable?: boolean }) => (
    <div className="flex items-center gap-1">
        <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-6 h-6 rounded-full border border-cosmere-blue text-cosmere-blue hover:bg-cosmere-blue hover:text-cosmere-gold flex items-center justify-center transition-colors font-display font-bold text-sm shadow-sm leading-none pb-0.5"
            aria-label="Decrease"
        >
            −
        </button>
        {editable ? (
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || 0))}
                className="w-28 text-center font-display font-bold text-cosmere-blue text-lg bg-transparent focus:outline-none focus:border-b-2 focus:border-cosmere-gold px-1 appearance-none m-0"
                style={{ MozAppearance: 'textfield' }}
            />
        ) : (
            <div className="w-8 text-center font-display font-bold text-cosmere-blue text-lg">
                {value}
            </div>
        )}
        <button
            onClick={() => onChange(value + 1)}
            className="w-6 h-6 rounded-full border border-cosmere-blue bg-cosmere-blue text-cosmere-gold hover:bg-cosmere-blue-hover flex items-center justify-center transition-colors font-display font-bold text-sm shadow-sm leading-none pb-0.5"
            aria-label="Increase"
        >
            +
        </button>
    </div>
);
