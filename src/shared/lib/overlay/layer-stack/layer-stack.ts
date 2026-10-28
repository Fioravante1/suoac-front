/**
 * Pilha das camadas abertas sobre a pagina (modais; menus quando o SUC-118 os
 * trouxer para ca).
 *
 * As teclas que uma camada trata — `Esc` para fechar, `Tab` para prender o foco —
 * sao ouvidas no `document`, para continuarem valendo quando o foco cai no
 * `<body>`. Com duas camadas abertas, as duas ouvem; a pilha e o que faz so a do
 * topo reagir.
 *
 * O topo e a camada mais aninhada e, entre as de mesma profundidade, a aberta por
 * ultimo. A ordem de abertura sozinha nao basta: quando um modal e o modal dentro
 * dele abrem juntos, o React roda o efeito do de dentro primeiro.
 */
type OpenLayer = Readonly<{ id: symbol; depth: number }>;

const openLayers: OpenLayer[] = [];

export type Layer = Readonly<{
  isTopmost: () => boolean;
  release: () => void;
}>;

function findTopmost(): OpenLayer | undefined {
  return openLayers.reduce<OpenLayer | undefined>(
    (top, layer) => (top === undefined || layer.depth >= top.depth ? layer : top),
    undefined,
  );
}

/** `depth` e quantas camadas envolvem esta na arvore de componentes (0 na raiz). */
export function registerLayer(depth = 0): Layer {
  const id = Symbol("layer");
  openLayers.push({ id, depth });

  return {
    isTopmost: () => findTopmost()?.id === id,
    release: () => {
      const index = openLayers.findIndex((layer) => layer.id === id);

      if (index === -1) return;

      openLayers.splice(index, 1);
    },
  };
}
