// Public API client-safe. A server fn de proxy NÃO é exportada aqui (é server-only) para não
// contaminar imports client deste barrel — o Route Handler a importa pelo caminho do módulo em `api/`.
export { ExportPassengersButton } from "./ui/export-passengers-button";
