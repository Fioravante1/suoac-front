import type { ReactNode } from "react";

interface InnerAuthScreenProps {
  children: ReactNode;
}

/**
 * Marca a tela de acesso como "interna": uma etapa que a pessoa abre depois da
 * tela de entrada (recuperar senha, autocadastro, redefinir senha).
 *
 * Abaixo de 1024px, essas telas abrem sem a apresentacao da marca e com a marca
 * no topo do formulario. O shell le o atributo pelo CSS (`:has`), em vez de
 * receber uma prop, porque quem sabe qual tela esta ativa e um componente de
 * cliente dentro dele, e o shell e renderizado no servidor.
 *
 * E um elemento de verdade, e nao `display: contents`: a troca de tela anima o
 * filho direto da coluna, e um elemento sem caixa nao anima.
 */
export function InnerAuthScreen({ children }: InnerAuthScreenProps) {
  return <div data-auth-screen="inner">{children}</div>;
}
