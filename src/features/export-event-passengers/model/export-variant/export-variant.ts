/**
 * Variantes de exportação do PDF de inscritos. Cada variante tem um público e um conjunto de colunas:
 * - `carrier`  → vai para a empresa de ônibus. Colunas: Nome · RG · Observação. Contém dado sensível
 *   (RG), então é restrita a papéis de circuito (o backend responde 403 para congregação).
 * - `boarding` → lista de conferência de embarque do capitão. Colunas: Nome · Telefone · Observação.
 *   Sem RG, disponível a todos os papéis. É o default assumido pelo backend quando omitido.
 */
export const EXPORT_VARIANTS = {
  CARRIER: "carrier",
  BOARDING: "boarding",
} as const;

export type ExportVariant = (typeof EXPORT_VARIANTS)[keyof typeof EXPORT_VARIANTS];

export const EXPORT_VARIANT_LABELS: Record<ExportVariant, string> = {
  [EXPORT_VARIANTS.CARRIER]: "Lista para a empresa de ônibus",
  [EXPORT_VARIANTS.BOARDING]: "Lista de embarque",
};

export const EXPORT_VARIANT_DESCRIPTIONS: Record<ExportVariant, string> = {
  [EXPORT_VARIANTS.CARRIER]: "Inclui RG. Vai para a empresa de transporte.",
  [EXPORT_VARIANTS.BOARDING]: "Inclui telefone. Para o capitão conferir os nomes no embarque.",
};
