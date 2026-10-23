/*
 * `server-only`, nao `"use server"`: o unico chamador e a propria pagina, que e
 * Server Component, e a Server Action de aceite. Como Server Action isto seria
 * mais uma superficie POST alcancavel pelo navegador, sem ganho algum.
 */
import "server-only";

import { endpoints, httpClientRaw } from "@/shared/api/http-client";
import type { Invitation } from "@/entities/invitation";

import type { InvitationLookup } from "../../model";
import { readInvitationFailure, rejectionOf } from "../invitation-failure";

/** 32 bytes em hexadecimal — o formato do link que o back envia (SUC-36). */
const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

/**
 * Consulta o convite **sem consumi-lo**, para a tela abrir ja sabendo o que
 * mostrar: quem convidou, o circuito, a congregacao — ou por que o link nao
 * serve.
 *
 * Contrato: `GET /invitations/:token`, publico — `200` com o contexto do
 * convite, ou um erro com `code` (`404`, `410`, `409`, `403`).
 *
 * Token fora do formato nem chega a API: nao ha o que consultar, e o caminho
 * da requisicao nao deve carregar texto arbitrario da URL.
 */
export async function loadInvitation(token: string): Promise<InvitationLookup> {
  if (!TOKEN_FORMAT.test(token)) {
    return { status: "rejected", rejection: { state: "not-found", details: null } };
  }

  try {
    /*
     * `anonymous`: esta funcao roda em render de Server Component, onde
     * escrever cookie e proibido. Sem ele, um `401` levaria o cliente a renovar
     * a sessao — e o convidado pode muito bem abrir o link num navegador com a
     * sessao de outra pessoa.
     */
    const response = await httpClientRaw(endpoints.invitations.detail(token), { anonymous: true });

    if (response.ok) {
      return { status: "pending", invitation: (await response.json()) as Invitation };
    }

    const rejection = rejectionOf(await readInvitationFailure(response));

    // Qualquer outra resposta e falha do servico, nao veredito sobre o link:
    // dizer "convite invalido" aqui mandaria a pessoa pedir outro sem motivo.
    return { status: "rejected", rejection: rejection ?? { state: "unavailable", details: null } };
  } catch {
    return { status: "rejected", rejection: { state: "unavailable", details: null } };
  }
}
