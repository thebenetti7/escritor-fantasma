import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Save } from 'lucide-react';
import { aiService } from '../services/ai/AiServiceAdapter';
import type { GeneratedContent, GeneratedImage, ToneOfVoice } from '../services/ai/types';

interface EditorState {
    productUrl: string;
    persona: string;
    tone: ToneOfVoice;
    mode: string;
    trendContext?: string;
    originalText?: string;
}

export const GhostEditor: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as EditorState;

    const [content, setContent] = useState<GeneratedContent | null>(null);
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasRun = React.useRef(false); // Guard against StrictMode double-fire

    useEffect(() => {
        if (!state) {
            navigate('/');
            return;
        }

        if (hasRun.current) return;
        hasRun.current = true;

        const fetchData = async () => {
            try {
                const [textData, imageData] = await Promise.all([
                    aiService.generateText({
                        tone: state.tone,
                        productUrl: state.productUrl,
                        persona: state.persona,
                        trendContext: state.trendContext,
                        originalText: state.originalText
                    }),
                    aiService.generateImages({
                        originalImageUrl: state.productUrl, // In real app, scrape this
                        style: 'photorealistic',
                        promptModifier: 'lifestyle scenario'
                    })
                ]);

                setContent(textData);
                setImages(imageData);
            } catch (error) {
                console.error("Failed to generate content", error);
                setError(error instanceof Error ? error.message : 'Falha desconhecida na geração');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [state, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-xl text-slate-300 animate-pulse">Criando sua obra-prima...</p>
                <p className="text-sm text-slate-500">Escrevendo texto e renderizando imagens</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-red-500/10 border border-red-500 rounded-xl p-8 max-w-lg">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Ops! Algo deu errado.</h2>
                    <p className="text-white mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Voltar para o Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
            {/* Toolbar */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center text-slate-400 hover:text-white cursor-pointer" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} className="mr-2" />
                    <span className="font-medium">Dashboard</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="flex items-center px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                        <RefreshCw size={16} className="mr-2" /> Regenerar
                    </button>
                    <button className="flex items-center px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-green-400 transition-colors">
                        <Save size={18} className="mr-2" /> Publicar
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-8 border-r border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {content && (
                            <>
                                <section className="space-y-4">
                                    <h1 className="text-4xl font-extrabold text-white leading-tight">{content.title}</h1>
                                    <div className="flex flex-wrap gap-2">
                                        {content.seoKeywords.map(kw => (
                                            <span key={kw} className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">#{kw}</span>
                                        ))}
                                    </div>
                                </section>

                                <div className="prose prose-invert prose-lg max-w-none">
                                    {content.sections.map((section, idx) => (
                                        <div key={idx} className="mb-8">
                                            <h2 className="text-2xl font-bold text-primary mb-4">{section.heading}</h2>
                                            <div dangerouslySetInnerHTML={{ __html: section.content }} />

                                            {section.ctaType && (
                                                <div className="my-8 p-6 bg-slate-800/50 border border-primary/20 rounded-xl text-center">
                                                    <p className="mb-4 text-slate-300">Gostou? Leve para casa agora.</p>
                                                    <button className={`px-8 py-3 rounded-full font-bold transition-transform hover:scale-105 ${section.ctaType === 'buy'
                                                        ? 'bg-primary text-black'
                                                        : 'bg-secondary text-white'
                                                        }`}>
                                                        {section.ctaType === 'buy' ? 'COMPRAR AGORA' : 'VER CATEGORIA COMPLETA'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Assets Panel */}
                <div className="w-[400px] bg-slate-900/30 p-6 flex flex-col border-l border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                        Galeria Visual
                        <span className="text-xs font-normal bg-slate-800 px-2 py-1 rounded text-slate-400">4 variações</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                        {images.map((img) => (
                            <div
                                key={img.variantId}
                                onClick={() => setSelectedImage(img.variantId)}
                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === img.variantId ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-500'
                                    }`}
                            >
                                <img src={img.url} alt="Variant" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                {selectedImage === img.variantId && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="bg-black/50 p-2 rounded-full text-white">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-800">
                        <button
                            className="w-full py-3 bg-slate-800 text-white rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedImage}
                        >
                            <Download size={18} className="mr-2" /> Download Selecionada
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
