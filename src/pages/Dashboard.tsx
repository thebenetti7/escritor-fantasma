import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Zap, Settings } from 'lucide-react';

interface ModeCardProps {
    title: string;
    description: string;
    icon: any;
    onClick: () => void;
    accentColor: string;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon: Icon, onClick, accentColor }) => (
    <div
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700 p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[${accentColor}]`}>
            <Icon size={48} />
        </div>
        <div className="mb-4 text-primary">
            <Icon size={48} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
);

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleModeSelect = (mode: string) => {
        navigate(`/wizard?mode=${mode}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
            <div className="max-w-6xl w-full">
                <header className="mb-16 text-center relative">
                    <button
                        onClick={() => navigate('/settings')}
                        className="absolute top-0 right-0 p-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-full hover:bg-slate-700 transition-all"
                        title="Configurações"
                    >
                        <Settings size={24} />
                    </button>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
                        Escritor Fantasma
                    </h1>
                    <p className="text-xl text-slate-400">
                        O Editor-Chefe com IA da Centersport
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ModeCard
                        title="Tenho o Produto"
                        description="Cole o link do produto e descubra tendências que combinam com ele."
                        icon={ShoppingBag}
                        accentColor="#00e676"
                        onClick={() => handleModeSelect('product-first')}
                    />
                    <ModeCard
                        title="Tenho a Trend"
                        description="Escolha um assunto em alta e conecte com um produto do catálogo."
                        icon={TrendingUp}
                        accentColor="#7c4dff"
                        onClick={() => handleModeSelect('trend-first')}
                    />
                    <ModeCard
                        title="Modo Manual"
                        description="Direto ao ponto: defina assunto e produto manualmente."
                        icon={Zap}
                        accentColor="#00e676"
                        onClick={() => handleModeSelect('manual')}
                    />
                </div>
            </div>
        </div>
    );
};
