import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Key, ArrowLeft, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [geminiKey, setGeminiKey] = useState('');
    const [openAiKey, setOpenAiKey] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const storedGemini = localStorage.getItem('v_gemini_key');
        const storedOpenAi = localStorage.getItem('v_openai_key');
        if (storedGemini) setGeminiKey(storedGemini);
        if (storedOpenAi) setOpenAiKey(storedOpenAi);
    }, []);

    const handleSave = () => {
        if (geminiKey) localStorage.setItem('v_gemini_key', geminiKey);
        else localStorage.removeItem('v_gemini_key');

        if (openAiKey) localStorage.setItem('v_openai_key', openAiKey);
        else localStorage.removeItem('v_openai_key');

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Force reload to apply changes to AiService (simple way)
        // Or we can add a method to AiService to reload keys
        // For now, prompt user or just let the next reload handle it, 
        // but better to reload window to ensure singleton AiService updates.
        setTimeout(() => window.location.reload(), 1000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-8">
            <button onClick={() => navigate('/')} className="flex items-center text-slate-400 hover:text-white mb-8 w-fit">
                <ArrowLeft className="mr-2" size={20} /> Voltar ao Dashboard
            </button>

            <div className="max-w-2xl w-full mx-auto space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Configurações</h1>
                    <p className="text-slate-400">Gerencie suas chaves de API para conectar a inteligência.</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6">

                    <div className="flex items-start bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-200 mb-6">
                        <ShieldAlert className="shrink-0 mr-3" />
                        <div className="text-sm">
                            <p className="font-bold mb-1">Atenção</p>
                            As chaves são salvas apenas no seu navegador (Local Storage).
                            Elas não são enviadas para nenhum servidor nosso.
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-white font-bold flex items-center">
                            <Key size={18} className="mr-2 text-blue-400" /> Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Cole sua chave AIza..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-400 focus:outline-none"
                        />
                        <p className="text-xs text-slate-500">
                            Recomendado: Modelo Gemini 1.5 Flash (Rápido e Estável)
                        </p>
                    </div>

                    <div className="space-y-4 opacity-75">
                        <label className="block text-white font-bold flex items-center">
                            <Key size={18} className="mr-2 text-green-400" /> OpenAI API Key (Opcional)
                        </label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            placeholder="sk-proj-..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-green-400 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center hover:bg-green-400 transition-all mt-8"
                    >
                        <Save className="mr-2" size={20} />
                        {showSuccess ? 'Configurações Salvas!' : 'Salvar Chaves'}
                    </button>

                    {showSuccess && (
                        <p className="text-center text-green-400 text-sm animate-pulse">
                            Recarregando aplicação para aplicar mudanças...
                        </p>
                    )}

                </div>
            </div>
        </div>
    );
};
