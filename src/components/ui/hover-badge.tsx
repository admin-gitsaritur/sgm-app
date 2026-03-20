import React from 'react';

// Componente individual para cada botão, com simples background e Shadow Glow ao hover
export const HoverBadge = ({ 
  name, 
  bgShape = "bg-gradient-to-br from-slate-700 to-slate-900",
  customStyle = {},
  corFonte = "branco"
}: { 
  name: string;
  bgShape?: string;
  customStyle?: React.CSSProperties;
  corFonte?: string;
}) => {
  const shadowConfig = { 
    boxShadow: customStyle.background 
      ? `0 4px 14px 0 ${customStyle.background}33` 
      : '0 4px 14px 0 rgba(0,0,0,0.1)' 
  };

  return (
    <div 
        className={`relative inline-flex items-center justify-center px-5 py-1.5 rounded-full ${bgShape}`}
        style={{ ...customStyle, ...shadowConfig }}
    >
        {/* Camada Suave de Vidro (Opcional, manteremos sutil) */}
        <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.01]" style={{ backdropFilter: 'blur(4px)' }} />

        {/* Texto Centralizado */}
        <span className={`relative z-10 font-bold tracking-wide text-[14px] ${corFonte === 'escuro' ? 'text-stone-900' : 'text-white'}`}>
            {name}
        </span>
    </div>
  );
};
