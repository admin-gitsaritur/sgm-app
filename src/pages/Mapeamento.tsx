import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Target, Briefcase, BarChart2, Layers } from 'lucide-react';
import { Spinner } from '../components/ui/spinner';
import { CardDescription } from '../components/ui/card';

// ── Node Colors by Layer ──
const LAYER_CONFIG = {
  meta: {
    bg: 'linear-gradient(135deg, #F37137 0%, #e05a1e 100%)',
    border: '#c94d16',
    text: '#fff',
    badge: 'Camada 1',
    icon: Target,
    shadow: '0 8px 32px rgba(243,113,55,0.3)',
  },
  projeto: {
    bg: 'linear-gradient(135deg, #4E3205 0%, #6b4507 100%)',
    border: '#3d2604',
    text: '#fff',
    badge: 'Camada 2',
    icon: Briefcase,
    shadow: '0 8px 32px rgba(78,50,5,0.3)',
  },
  indicador: {
    bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    border: '#065f46',
    text: '#fff',
    badge: 'Camada 3',
    icon: BarChart2,
    shadow: '0 8px 32px rgba(5,150,105,0.3)',
  },
  avulso: {
    bg: 'linear-gradient(135deg, #78716C 0%, #57534E 100%)',
    border: '#44403C',
    text: '#fff',
    badge: 'Avulsos',
    icon: BarChart2,
    shadow: '0 8px 32px rgba(120,113,108,0.3)',
  },
};

// ── Custom Node Component ──
function FlowNode({ data }: { data: any }) {
  const config = LAYER_CONFIG[data.layer as keyof typeof LAYER_CONFIG];
  const Icon = config.icon;

  return (
    <div
      className="relative group"
      style={{
        minWidth: 200,
        maxWidth: 280,
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: config.border,
          width: 10, height: 10,
          border: '2px solid #fff',
          top: -5,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: config.border,
          width: 10, height: 10,
          border: '2px solid #fff',
          bottom: -5,
        }}
      />

      <div
        style={{
          background: config.bg,
          border: `2px solid ${config.border}`,
          boxShadow: config.shadow,
          borderRadius: 16,
          padding: '16px 20px',
          color: config.text,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        className="group-hover:scale-[1.02]"
      >
        <div
          style={{
            position: 'absolute', top: -10, right: 16,
            background: 'rgba(255,255,255,0.95)',
            color: config.border,
            fontSize: 10, fontWeight: 700,
            padding: '2px 10px', borderRadius: 20,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {config.badge}
        </div>

        <div className="flex items-start gap-3">
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, wordBreak: 'break-word' }}>
              {data.label}
            </div>
            {data.subtitle && (
              <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 500 }}>
                {data.subtitle}
              </div>
            )}
          </div>
        </div>

        {data.progress !== undefined && (
          <div style={{ marginTop: 12 }}>
            <div className="flex justify-between" style={{ fontSize: 10, opacity: 0.8, marginBottom: 4 }}>
              <span>Progresso</span>
              <span style={{ fontWeight: 700 }}>{data.progress}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }}>
              <div
                style={{
                  height: '100%', borderRadius: 4,
                  background: 'rgba(255,255,255,0.8)',
                  width: `${Math.min(data.progress, 100)}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { flowNode: FlowNode };

// ── Persist positions in localStorage ──
const STORAGE_KEY = 'sgm-mapeamento-positions';

function savePositions(nodes: Node[]) {
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => { pos[n.id] = n.position; });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

function clearPositions() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}


function loadPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// ── Auto-layout tree ──
function buildLayout(metas: any[], projetos: any[], indicadores: any[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const saved = loadPositions();

  const META_Y = 80, PROJ_Y = 320, IND_Y = 560;
  const NODE_W = 260, GAP_X = 40;

  const projByMeta: Record<string, any[]> = {};
  const projsAvulsos: any[] = [];
  projetos.forEach(p => {
    if (p.metaId) {
      if (!projByMeta[p.metaId]) projByMeta[p.metaId] = [];
      projByMeta[p.metaId].push(p);
    } else {
      projsAvulsos.push(p);
    }
  });

  const indByProj: Record<string, any[]> = {};
  const indDiretosByMeta: Record<string, any[]> = {};
  const indsAvulsos: any[] = [];

  indicadores.forEach(ind => {
    if (ind.projetoId) {
      if (!indByProj[ind.projetoId]) indByProj[ind.projetoId] = [];
      indByProj[ind.projetoId].push(ind);
    } else if (ind.metaId) {
      if (!indDiretosByMeta[ind.metaId]) indDiretosByMeta[ind.metaId] = [];
      indDiretosByMeta[ind.metaId].push(ind);
    } else {
      indsAvulsos.push(ind);
    }
  });

  let globalX = 80;

  metas.forEach(meta => {
    const metaProjs = projByMeta[meta.id] || [];
    const metaInds = indDiretosByMeta[meta.id] || [];
    let totalInds = 0;
    metaProjs.forEach(proj => { totalInds += Math.max((indByProj[proj.id] || []).length, 1); });

    const subtreeWidth = Math.max(
      NODE_W,
      Math.max(metaProjs.length, 1) * (NODE_W + GAP_X) - GAP_X,
      totalInds * (NODE_W + GAP_X) - GAP_X,
      metaInds.length * (NODE_W + GAP_X) - GAP_X
    );

    const metaId = `meta-${meta.id}`;
    const metaCenterX = globalX + subtreeWidth / 2 - NODE_W / 2;
    const pct = meta.valorMetaCentavos > 0
      ? ((meta.realizadoCentavos || 0) / meta.valorMetaCentavos * 100).toFixed(1) : '0.0';

    nodes.push({
      id: metaId, type: 'flowNode',
      position: saved[metaId] || { x: metaCenterX, y: META_Y },
      data: { label: meta.nome, subtitle: `Ano ${meta.ano || '—'}`, layer: 'meta', progress: parseFloat(pct) },
    });

    const projStartX = globalX + (subtreeWidth - (metaProjs.length * (NODE_W + GAP_X) - GAP_X)) / 2;

    metaProjs.forEach((proj, pi) => {
      const projX = projStartX + pi * (NODE_W + GAP_X);
      const projId = `proj-${proj.id}`;

      nodes.push({
        id: projId, type: 'flowNode',
        position: saved[projId] || { x: projX, y: PROJ_Y },
        data: { label: proj.nome, subtitle: proj.responsavelPrincipalNome || '—', layer: 'projeto' },
      });
      edges.push({
        id: `e-${metaId}-${projId}`, source: metaId, target: projId,
        type: 'smoothstep', animated: true,
        style: { stroke: '#F37137', strokeWidth: 2, opacity: 0.6 },
      });

      const projInds = indByProj[proj.id] || [];
      const indStartX = projX - ((projInds.length - 1) * (NODE_W + GAP_X)) / 2;

      projInds.forEach((ind, ii) => {
        const indId = `ind-${ind.id}`;
        const indX = indStartX + ii * (NODE_W + GAP_X);
        const indPct = ind.metaIndicadorCentavos > 0
          ? ((ind.realizadoCentavos || 0) / ind.metaIndicadorCentavos * 100).toFixed(1) : '0.0';

        nodes.push({
          id: indId, type: 'flowNode',
          position: saved[indId] || { x: indX, y: IND_Y },
          data: { label: ind.nome, subtitle: ind.statusAtualizacao || '—', layer: 'indicador', progress: parseFloat(indPct) },
        });
        edges.push({
          id: `e-${projId}-${indId}`, source: projId, target: indId,
          type: 'smoothstep', animated: true,
          style: { stroke: '#4E3205', strokeWidth: 2, opacity: 0.5 },
        });
      });
    });

    const metaIndStartX = globalX + (subtreeWidth - (metaInds.length * (NODE_W + GAP_X) - GAP_X)) / 2;
    metaInds.forEach((ind, ii) => {
      const indId = `ind-meta-${ind.id}`;
      const indX = metaIndStartX + ii * (NODE_W + GAP_X);
      const indPct = ind.metaIndicadorCentavos > 0
        ? ((ind.realizadoCentavos || 0) / ind.metaIndicadorCentavos * 100).toFixed(1) : '0.0';

      nodes.push({
        id: indId, type: 'flowNode',
        position: saved[indId] || { x: indX, y: IND_Y },
        data: { label: ind.nome, subtitle: ind.statusAtualizacao || '—', layer: 'indicador', progress: parseFloat(indPct) },
      });
      edges.push({
        id: `e-${metaId}-${indId}`, source: metaId, target: indId,
        type: 'smoothstep', animated: true,
        style: { stroke: '#F37137', strokeWidth: 2, opacity: 0.6 },
      });
    });

    globalX += subtreeWidth + 120;
  });

  if (indsAvulsos.length > 0 || projsAvulsos.length > 0) {
    const avulsoStartX = globalX;

    let totalAvulsosIndsViaProj = 0;
    projsAvulsos.forEach(proj => { totalAvulsosIndsViaProj += Math.max((indByProj[proj.id] || []).length, 1); });

    const avulsoSubtreeWidth = Math.max(
      NODE_W,
      projsAvulsos.length > 0 ? (projsAvulsos.length * (NODE_W + GAP_X) - GAP_X) : 0,
      totalAvulsosIndsViaProj * (NODE_W + GAP_X) - GAP_X,
      indsAvulsos.length * (NODE_W + GAP_X) - GAP_X
    );

    const pseudoMetaId = 'meta-avulsos';
    nodes.push({
      id: pseudoMetaId, type: 'flowNode',
      position: saved[pseudoMetaId] || { x: avulsoStartX + avulsoSubtreeWidth / 2 - NODE_W / 2, y: META_Y },
      data: { label: 'Estruturas Avulsas', subtitle: 'Não vinculadas a metas', layer: 'avulso' },
    });

    // Draw avulso projects
    if (projsAvulsos.length > 0) {
      const projStartX = avulsoStartX + (avulsoSubtreeWidth - (projsAvulsos.length * (NODE_W + GAP_X) - GAP_X)) / 2;

      projsAvulsos.forEach((proj, pi) => {
        const projX = projStartX + pi * (NODE_W + GAP_X);
        const projId = `proj-${proj.id}`;

        nodes.push({
          id: projId, type: 'flowNode',
          position: saved[projId] || { x: projX, y: PROJ_Y },
          data: { label: proj.nome, subtitle: proj.responsavelPrincipalNome || '—', layer: 'projeto' },
        });
        edges.push({
          id: `e-${pseudoMetaId}-${projId}`, source: pseudoMetaId, target: projId,
          type: 'smoothstep', animated: true,
          style: { stroke: '#78716C', strokeWidth: 2, opacity: 0.6 },
        });

        const projInds = indByProj[proj.id] || [];
        const projIndStartX = projX - ((projInds.length - 1) * (NODE_W + GAP_X)) / 2;

        projInds.forEach((ind, ii) => {
          const indId = `ind-${ind.id}`;
          const indX = projIndStartX + ii * (NODE_W + GAP_X);
          const indPct = ind.metaIndicadorCentavos > 0
            ? ((ind.realizadoCentavos || 0) / ind.metaIndicadorCentavos * 100).toFixed(1) : '0.0';

          nodes.push({
            id: indId, type: 'flowNode',
            position: saved[indId] || { x: indX, y: IND_Y },
            data: { label: ind.nome, subtitle: ind.statusAtualizacao || '—', layer: 'indicador', progress: parseFloat(indPct) },
          });
          edges.push({
            id: `e-${projId}-${indId}`, source: projId, target: indId,
            type: 'smoothstep', animated: true,
            style: { stroke: '#4E3205', strokeWidth: 2, opacity: 0.5 },
          });
        });
      });
    }

    // Draw avulso indicators directly under pseudo-meta
    if (indsAvulsos.length > 0) {
      const indStartX = avulsoStartX + (avulsoSubtreeWidth - (indsAvulsos.length * (NODE_W + GAP_X) - GAP_X)) / 2;
      indsAvulsos.forEach((ind, i) => {
        const indId = `ind-avulso-${ind.id}`;
        const indX = indStartX + i * (NODE_W + GAP_X);
        const indPct = ind.metaIndicadorCentavos > 0
          ? ((ind.realizadoCentavos || 0) / ind.metaIndicadorCentavos * 100).toFixed(1) : '0.0';

        nodes.push({
          id: indId, type: 'flowNode',
          position: saved[indId] || { x: indX, y: IND_Y },
          data: { label: ind.nome, subtitle: ind.statusAtualizacao || '—', layer: 'indicador', progress: parseFloat(indPct) },
        });
        edges.push({
          id: `e-${pseudoMetaId}-${indId}`, source: pseudoMetaId, target: indId,
          type: 'smoothstep', animated: true,
          style: { stroke: '#78716C', strokeWidth: 2, opacity: 0.5 },
        });
      });
    }
    
    globalX += avulsoSubtreeWidth + 120;
  }

  return { nodes, edges };
}

// ── Page Component ──
export const Mapeamento = () => {
  const [metas, setMetas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [mRes, pRes, iRes] = await Promise.all([
          api('/metas'), api('/projetos'), api('/indicadores'),
        ]);
        if (mRes.success) setMetas(mRes.data);
        if (pRes.success) setProjetos(pRes.data);
        if (iRes.success) setIndicadores(iRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (metas.length || projetos.length || indicadores.length) {
      const { nodes: n, edges: e } = buildLayout(metas, projetos, indicadores);
      setNodes(n);
      setEdges(e);
    }
  }, [metas, projetos, indicadores]);

  // Save positions when user stops dragging
  const handleNodeDragStop = useCallback((_: any, __: Node, nodes: Node[]) => {
    savePositions(nodes);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapeamento Estratégico"
        subtitle="Visualização hierárquica: Metas → Projetos → Indicadores"
      />

      {/* Legend */}
      <div className="flex items-center gap-6 px-4">
        {Object.entries(LAYER_CONFIG).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <div key={key} className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: 4, background: conf.bg, border: `1.5px solid ${conf.border}` }} />
              <span className="text-xs font-semibold text-brown/70">{conf.badge}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 text-xs text-stone-400 ml-auto">
          <Layers size={14} />
          <span>Arraste os nós para reorganizar · Posições são salvas automaticamente</span>
        </div>
      </div>

      {/* Flow Canvas */}
      <div
        className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50"
        style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <CardDescription>Carregando mapeamento...</CardDescription>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            nodesConnectable={false}
            nodesDraggable={true}
            elementsSelectable={true}
            panOnScroll={true}
            zoomOnScroll={true}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d6d3d1" />
            <Controls
              showInteractive={false}
              style={{ borderRadius: 12, border: '1px solid #e7e5e4', overflow: 'hidden' }}
            />
            <MiniMap
              nodeColor={(n) => {
                const l = n.data?.layer as string;
                return l === 'meta' ? '#F37137' : l === 'projeto' ? '#4E3205' : l === 'indicador' ? '#059669' : l === 'avulso' ? '#78716C' : '#a8a29e';
              }}
              style={{ borderRadius: 12, border: '1px solid #e7e5e4', overflow: 'hidden' }}
              maskColor="rgba(0,0,0,0.08)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};
