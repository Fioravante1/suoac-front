import { type ClipboardEvent, useCallback, useState } from "react";

import { PASSWORD_MAX_LENGTH, PASSWORD_TRUNCATED_MESSAGE } from "../password-policy";

interface UsePasswordTruncationNoticeReturn {
  /** Mensagem a exibir abaixo do campo, ou `undefined` quando nao houve corte. */
  truncationNotice: string | undefined;
  /** Ligar ao `onPaste` do campo de senha nova. */
  handlePaste: (event: ClipboardEvent<HTMLInputElement>) => void;
}

/**
 * Avisa quando o `maxLength` do campo corta a senha colada.
 *
 * O teto de digitacao existe para o medidor nao dizer "forte" numa senha que o
 * formulario recusa — mas ele corta sem dizer nada, e o caso real e grave:
 * quem cola senha de gerenciador com mais de `PASSWORD_MAX_LENGTH` caracteres
 * nos dois campos entra com a senha truncada nos dois, a confirmacao coincide,
 * a API aceita, e o gerenciador segue guardando a senha inteira — que nao entra
 * mais. O proximo login falha e so uma redefinicao resolve.
 *
 * O aviso sai sozinho quando o campo deixa o teto: apagar o excedente ou
 * recomecar a digitacao e, na pratica, a correcao.
 */
export function usePasswordTruncationNotice(value: string): UsePasswordTruncationNoticeReturn {
  const [truncatedOnPaste, setTruncatedOnPaste] = useState(false);

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    // O trecho selecionado e substituido pela colagem, entao nao conta no total.
    const selectedLength = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0);
    const pastedLength = event.clipboardData.getData("text").length;

    setTruncatedOnPaste(input.value.length - selectedLength + pastedLength > PASSWORD_MAX_LENGTH);
  }, []);

  const isAtCeiling = value.length >= PASSWORD_MAX_LENGTH;

  return {
    truncationNotice: truncatedOnPaste && isAtCeiling ? PASSWORD_TRUNCATED_MESSAGE : undefined,
    handlePaste,
  };
}
