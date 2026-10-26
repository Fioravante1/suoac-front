/**
 * Moldura das telas de acesso: o painel de apresentacao a esquerda e a coluna
 * da tela ativa a direita.
 *
 * Nasceu dentro de `pages/login-next` e foi promovida para ca quando a segunda
 * tela da fatia — redefinir senha — precisou da mesma moldura (SUC-26). Slice
 * nao importa slice vizinho da mesma camada, e copiar o layout dividido daria
 * seis copias divergentes ao fim da Fatia 1: entrar, recuperar, redefinir,
 * convite e as etapas do autocadastro.
 */
export { AuthShell } from "./ui/auth-shell";
export { AuthPanel } from "./ui/auth-panel";
export { BrandPanel } from "./ui/brand-panel";
export { BrandPanelFrame } from "./ui/brand-panel-frame";
export { InnerAuthScreen } from "./ui/inner-auth-screen";
