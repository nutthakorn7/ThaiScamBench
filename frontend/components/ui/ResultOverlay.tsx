"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, ShieldCheck, X, AlertTriangle, CheckCircle2 } from "lucide-react"

import ReactConfetti from "react-confetti"

interface DetectionResult {
    is_scam: boolean;
    risk_score: number;
    category: string;
    reason: string;
    advice: string;
}

interface ResultOverlayProps {
    isOpen: boolean;
    result: DetectionResult | null;
    imageSrc?: string | null;
    textInput?: string;
    onClose: () => void;
}

export function ResultOverlay({ isOpen, result, imageSrc, textInput, onClose }: ResultOverlayProps) {
    if (!result) return null;

    const isScam = result.is_scam;
    
    // Scroll Lock Effect
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                    {/* Confetti for Safe Result */}
                    {!isScam && <ReactConfetti recycle={false} numberOfPieces={500} gravity={0.15} />}

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Main Card */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100 }}
                        animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            y: 0,
                            transition: { type: "spring", bounce: 0.4, duration: 0.8 }
                        }}
                        exit={{ scale: 0.8, opacity: 0, y: 100 }}
                        className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center border-4 flex flex-col max-h-[90vh] ${
                            isScam 
                            ? "bg-red-950 border-red-500 shadow-red-900/50" 
                            : "bg-green-950 border-green-500 shadow-green-900/50"
                        }`}
                    >
                        {/* Background Pulse Effect (Grand) */}
                        <div className={`absolute inset-0 opacity-20 pointer-events-none ${isScam ? "animate-pulse bg-red-600" : "bg-green-600"}`}></div>

                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-20 bg-black/20 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <div className="relative z-10 flex flex-col items-center gap-6 overflow-y-auto no-scrollbar">
                            
                            {/* Animated Icon Header */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="shrink-0"
                            >
                                {isScam ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-50 animate-pulse"></div>
                                        <ShieldAlert size={100} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                        <motion.div 
                                            animate={{ x: [-2, 2, -2] }}
                                            transition={{ repeat: Infinity, duration: 0.2 }}
                                            className="absolute -top-2 -right-2 text-yellow-400"
                                        >
                                            <AlertTriangle size={40} className="fill-yellow-500 text-yellow-900" />
                                        </motion.div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-500 blur-3xl opacity-50"></div>
                                        <ShieldCheck size={100} className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.2, 1] }}
                                            transition={{ delay: 0.5 }}
                                            className="absolute -bottom-2 -right-2 text-white bg-green-600 rounded-full p-2"
                                        >
                                            <CheckCircle2 size={28} />
                                        </motion.div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Headline */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="shrink-0"
                            >
                                <h2 className={`text-4xl md:text-5xl font-black tracking-tighter uppercase ${
                                    isScam ? "text-red-500 drop-shadow-lg" : "text-green-400 drop-shadow-lg"
                                }`}>
                                    {isScam ? "WARNING: SCAM!" : "VERIFIED SAFE"}
                                </h2>
                                <p className={`mt-2 text-lg font-medium tracking-widest ${
                                    isScam ? "text-red-200" : "text-green-200"
                                }`}>
                                    {isScam ? "ความเสี่ยงสูง (High Risk)" : "ปลอดภัย (Low Risk)"}
                                </p>
                            </motion.div>

                            {/* Evidence Display (Image or Text) */}
                            {(imageSrc || textInput) && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="w-full max-w-sm bg-black/40 rounded-xl p-4 border border-white/10 backdrop-blur-md"
                                >
                                    <p className="text-xs uppercase tracking-wider text-white/50 mb-2 font-bold">
                                        หลักฐานที่ตรวจสอบ
                                    </p>
                                    {imageSrc ? (
                                        <div className="rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                                            <img src={imageSrc} alt="Evidence" className="w-full h-auto max-h-[200px] object-contain bg-black/50" />
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-lg p-3 text-sm text-white/80 italic border border-white/10 max-h-[100px] overflow-y-auto">
                                            "{textInput?.slice(0, 100)}{textInput && textInput.length > 100 ? "..." : ""}"
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Divider */}
                            <div className={`h-1 w-24 rounded-full shrink-0 ${isScam ? "bg-red-800" : "bg-green-800"}`} />

                            {/* Details/Advice */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-4 w-full"
                            >
                                <div className={`p-4 rounded-xl border text-left ${
                                    isScam 
                                    ? "bg-red-950/50 border-red-900 text-red-100" 
                                    : "bg-green-950/50 border-green-900 text-green-100"
                                }`}>
                                    <p className="text-lg font-semibold mb-1 flex items-center gap-2">
                                        🤖 ผลการวิเคราะห์ AI
                                    </p>
                                    <p className="text-sm opacity-90 leading-relaxed">
                                        {result.reason}
                                    </p>
                                </div>

                                <div className={`text-sm font-bold p-3 rounded-lg text-center border ${
                                    isScam 
                                    ? "bg-yellow-950/30 border-yellow-800 text-yellow-400" 
                                    : "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                                }`}>
                                    💡 คำแนะนำ: {result.advice}
                                </div>
                            </motion.div>

                            {/* Action Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all mt-auto ${
                                    isScam 
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40" 
                                    : "bg-green-600 hover:bg-green-500 text-white shadow-green-900/40"
                                }`}
                            >
                                {isScam ? "รับทราบและระมัดระวัง" : "ตกลง"}
                            </motion.button>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
