import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { format } from 'date-fns';

export const Metas = () => {
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMetas();
  }, []);

  const fetchMetas = async () => {
    try {
      const response = await api('/metas');
      if (response.success) {
        setMetas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar metas', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4E3205]">Gestão de Metas</h1>
          <p className="text-gray-500 mt-1">Gerencie as metas estratégicas corporativas (Camada 1)</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#F37137] text-white rounded-lg hover:bg-[#d95f27] transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Nova Meta</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Nome da Meta</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Valor (R$)</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Ano</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Período</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Indicador Macro</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : metas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhuma meta cadastrada</td>
                </tr>
              ) : (
                metas.map((meta) => (
                  <tr key={meta.id} className="hover:bg-[#F37137]/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F37137]/10 flex items-center justify-center">
                          <Target className="w-4 h-4 text-[#F37137]" />
                        </div>
                        <span className="font-medium text-[#4E3205]">{meta.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#4E3205]">{formatCurrency(meta.valorMeta)}</td>
                    <td className="px-6 py-4 text-gray-600">{meta.ano}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {format(new Date(meta.periodoInicio), 'dd/MM/yyyy')} - {format(new Date(meta.periodoFim), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{meta.indicadorMacro}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {meta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-2 text-gray-400 hover:text-[#F37137] transition-colors rounded-lg hover:bg-white">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
