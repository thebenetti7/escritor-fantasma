import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import type { ToneOfVoice } from '../services/ai/types';
import { aiService } from '../services/ai/AiServiceAdapter';

export const ConfigWizard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'manual';

    const [step, setStep] = useState(1);
    const [productUrl, setProductUrl] = useState('');
    const [inferredPersona, setInferredPersona] = useState<string | null>(null);
    const [selectedTone, setSelectedTone] = useState<ToneOfVoice>('journalistic');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // New State for Multi-Mode
    const [trendContext, setTrendContext] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [suggestedTrends, setSuggestedTrends] = useState<string[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(false);

    const analyzeProduct = async () => {
        if (!productUrl) return;
        setIsAnalyzing(true);
        try {
            const result = await aiService.analyzeProduct(productUrl);
            setInferredPersona(`${result.persona} (${result.reason})`);

            // Should next step be 2?
            setStep(2);

        } catch (error) {
            console.error('Analysis failed', error);
            setInferredPersona('Consumidor Padrão (Análise indisponível)');
            setStep(2);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const fetchTrends = async () => {
        if (!productUrl || !inferredPersona) return;
        setLoadingTrends(true);
        try {
            const trends = await aiService.getTrends(productUrl, inferredPersona);
            setSuggestedTrends(trends);
        } catch (e) {
            console.error("Failed to fetch trends", e);
        } finally {
            setLoadingTrends(false);
        }
    };

    const handleGenerate = () => {
        navigate('/editor', {
            state: {
                productUrl,
                persona: inferredPersona,
                tone: selectedTone,
                mode,
                trendContext,   // Pass new fields
                originalText
            }
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-8">
            <div className="fixed bottom-4 right-4 bg-black/80 text-xs text-slate-500 p-2 rounded pointer-events-none">
                AI Provider: {aiService.getProviderName().toUpperCase()}
            </div>
            <button onClick={() => navigate('/')} className="flex items-center text-slate-400 hover:text-white mb-8 w-fit">
                <ArrowLeft className="mr-2" size={20} /> Voltar ao Dashboard
            </button>

            <div className="max-w-2xl w-full mx-auto">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-12">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-700'}`} />
                    <div className="w-4" />
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-700'}`} />
                    <div className="w-4" />
                    <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-700'}`} />
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-3xl font-bold">Qual é o produto?</h2>
                        <p className="text-slate-400">Cole o URL do produto da Centersport para começarmos.</p>

                        <input
                            type="text"
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                            placeholder="https://centersport.com.br/produto/..."
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white focus:border-primary focus:outline-none transition-colors"
                        />

                        <button
                            onClick={analyzeProduct}
                            disabled={!productUrl || isAnalyzing}
                            className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" /> Analisando Produto...
                                </>
                            ) : (
                                <>
                                    Analisar e Detectar Persona <Bot className="ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-800/50 border border-secondary/30 p-6 rounded-xl mb-8">
                            <h3 className="text-secondary font-bold mb-2 flex items-center"><Bot className="mr-2" size={18} /> Análise da IA</h3>
                            <p className="text-lg text-white">
                                Detectei que este produto é ideal para: <strong className="text-primary">{inferredPersona}</strong>
                            </p>
                        </div>

                        {/* --- MODO: PRODUCT-FIRST (AUTO TRENS) --- */}
                        {mode === 'product-first' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold">Escolha a Trend Principal 🔥</h2>
                                <p className="text-slate-400">Encontrei estes assuntos em alta conectados ao seu público:</p>

                                {loadingTrends ? (
                                    <div className="flex items-center text-slate-400"><Loader2 className="animate-spin mr-2" /> Caçando tendências...</div>
                                ) : suggestedTrends.length === 0 ? (
                                    <button
                                        onClick={fetchTrends}
                                        className="py-3 px-6 bg-secondary text-white rounded-lg font-bold hover:bg-purple-600 transition-colors flex items-center"
                                    >
                                        <Bot className="mr-2" size={18} /> Descobrir Trends para este Produto
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {suggestedTrends.map((trend, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setTrendContext(trend)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${trendContext === trend ? 'border-primary bg-primary/20 text-white' : 'border-slate-700 hover:border-slate-500'}`}
                                            >
                                                {trend}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- MODO: TREND-FIRST (MANUAL TREND) --- */}
                        {mode === 'trend-first' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold">Qual é a Trend? 📈</h2>
                                <p className="text-slate-400">Cole o link da notícia ou descreva o assunto do momento.</p>
                                <textarea
                                    value={trendContext}
                                    onChange={(e) => setTrendContext(e.target.value)}
                                    placeholder="Ex: O filme da Barbie estourou e todo mundo quer usar rosa..."
                                    className="w-full h-32 bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        )}

                        {/* --- MODO: MANUAL (TEXT REVISION) --- */}
                        {mode === 'manual' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold">Texto Original 📝</h2>
                                <p className="text-slate-400">Cole o texto que você já escreveu para a IA revisar e ilustrar.</p>
                                <textarea
                                    value={originalText}
                                    onChange={(e) => setOriginalText(e.target.value)}
                                    placeholder="Cole seu artigo aqui..."
                                    className="w-full h-48 bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        )}

                        <div className="h-8"></div>

                        <h2 className="text-3xl font-bold">Defina a Voz</h2>
                        <p className="text-slate-400">Como você quer que o artigo seja escrito?</p>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { value: 'serious', label: 'Sério', desc: 'Direto e profissional' },
                                { value: 'journalistic', label: 'Jornalístico', desc: 'Informativo e imparcial' },
                                { value: 'humorous', label: 'Divertido', desc: 'Leve e descontraído' },
                                { value: 'technical', label: 'Técnico', desc: 'Analítico e detalhista' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedTone(option.value as ToneOfVoice)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTone === option.value
                                        ? 'border-primary bg-primary/10 text-white'
                                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    <span className="capitalize block font-bold mb-1">{option.label}</span>
                                    <span className="text-xs opacity-70">
                                        {option.desc}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={
                                (mode === 'trend-first' && !trendContext) ||
                                (mode === 'manual' && !originalText) ||
                                (mode === 'product-first' && !trendContext)
                            }
                            className="w-full mt-8 bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Gerar Conteúdo <ChevronRight className="ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
