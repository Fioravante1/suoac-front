import { z } from "zod";

/*
 * Importado do modulo, nao do barril `@/shared/lib`: este schema e alcancado
 * pela Server Action do envio, e o barril reexporta hooks `"use client"` —
 * o build falha ao ver hook de cliente no grafo do servidor. Mesmo motivo do
 * schema da troca de senha.
 */
import { newPasswordSchema } from "@/shared/lib/password-policy";

/** Dígitos de um celular com DDD, com e sem o nono dígito. */
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;

/** Código de congregação: letras, números e hífen **entre** eles. */
const CODE_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;

const CODE_MESSAGE = "Use letras, números e hífen entre eles (ex.: SP-17).";
const CIRCUIT_MAX_LENGTH = 20;

function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

/** Etapa 1 — quem está cadastrando o circuito. */
const coordinatorSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(150, "O nome pode ter até 150 caracteres."),
  email: z.email("Informe um e-mail válido.").max(255, "O e-mail pode ter até 255 caracteres."),
  /**
   * Validado por contagem de dígitos, não por formato: o campo é exibido com
   * máscara e o mesmo celular digitado com ou sem ela precisa ser aceito. A
   * normalização para apenas dígitos acontece no envio — a API guarda só eles.
   */
  phone: z
    .string()
    .refine((value) => countDigits(value) >= PHONE_MIN_DIGITS, "Informe o DDD e o número completo.")
    .refine((value) => countDigits(value) <= PHONE_MAX_DIGITS, "O celular tem no máximo 11 dígitos."),
  password: newPasswordSchema,
});

/** Etapa 2 — o circuito que está nascendo. */
const circuitSchema = z.object({
  /**
   * `name` é o identificador real do circuito (`SP-17`, `SP-019 A`). Não há
   * um código e um nome descritivo separados no domínio. A transformação deixa
   * o payload no mesmo formato canônico que a API persiste.
   */
  name: z
    .string()
    .trim()
    .min(2, "Informe o circuito.")
    .max(CIRCUIT_MAX_LENGTH, `O circuito pode ter até ${CIRCUIT_MAX_LENGTH} caracteres.`)
    .transform((value) => value.toUpperCase()),
  city: z.string().trim().min(2, "Informe a cidade.").max(100, "A cidade pode ter até 100 caracteres."),
  /* Normalizada como o identificador do circuito: a API só aceita `[A-Z]{2}`. */
  state: z
    .string()
    .trim()
    .length(2, "A UF tem duas letras.")
    .regex(/^[A-Za-z]{2}$/, "A UF tem duas letras.")
    .transform((value) => value.toUpperCase()),
});

/** Uma linha da etapa 3. */
const congregationSchema = z.object({
  name: z.string().trim().max(150, "O nome pode ter até 150 caracteres."),
  /*
   * Normalizado em maiúsculas, como o identificador do circuito: `CODE_PATTERN`
   * só aceita `[A-Z0-9]`, e sem a transformação quem digitasse `sp17-central`
   * levava "use letras, números e hífen" — que é exatamente o que tinha feito.
   */
  code: z
    .string()
    .trim()
    .max(20, "O código pode ter até 20 caracteres.")
    .transform((value) => value.toUpperCase()),
});

/**
 * Etapa 3 — as congregações do circuito.
 *
 * A **primeira** é a congregação do próprio coordenador, e é ela que recebe o
 * `congregationId` do usuário criado; por isso nome e código são obrigatórios
 * ali e a ordem é significativa. Nas demais, o código é obrigatório apenas
 * quando o nome foi preenchido — linha em branco é só uma linha que o usuário
 * abriu e não usou.
 *
 * O e-mail não é pedido de propósito: o coordenador do circuito não tem como
 * saber o endereço de cada congregação no momento do cadastro (SUC-31).
 */
const congregationsSchema = z
  .array(congregationSchema)
  .min(1, "Informe sua congregação.")
  .superRefine((congregations, ctx) => {
    congregations.forEach((congregation, index) => {
      const isOwn = index === 0;
      const hasName = congregation.name.length > 0;
      const hasCode = congregation.code.length > 0;

      if (isOwn && !hasName) {
        ctx.addIssue({ code: "custom", path: [index, "name"], message: "Informe o nome da sua congregação." });
      }

      if ((isOwn || hasName) && !hasCode) {
        ctx.addIssue({ code: "custom", path: [index, "code"], message: "Informe o código." });
      }

      if (hasCode && !CODE_PATTERN.test(congregation.code)) {
        ctx.addIssue({ code: "custom", path: [index, "code"], message: CODE_MESSAGE });
      }
    });

    const codes = congregations.map((item) => item.code).filter((code) => code.length > 0);
    const duplicated = codes.find((code, index) => codes.indexOf(code) !== index);

    if (duplicated) {
      // A API responde `422` para isto. Barrar aqui poupa uma das poucas
      // tentativas que o limite por e-mail concede.
      /*
       * Com caminho da linha repetida, e não solto na raiz: sem `path`, o erro
       * cai em `congregations`, a tela lê `errors.congregations?.[index]` e
       * nada aparece — o avanço simplesmente para, sem dizer por quê.
       */
      const duplicatedIndex = congregations.findIndex(
        (item, index) => item.code === duplicated && codes.indexOf(duplicated) !== index,
      );

      ctx.addIssue({
        code: "custom",
        path: [duplicatedIndex, "code"],
        message: `O código ${duplicated} aparece duas vezes.`,
      });
    }
  });

const stepOneSchema = z.object({ coordinator: coordinatorSchema });

const stepTwoSchema = z.object({
  circuit: circuitSchema,
  /**
   * Não vai para a API: é consentimento, exigido pelo desenho na etapa 2.
   *
   * `boolean` com `refine`, e não `literal(true)`, para que o tipo admita o
   * `false` inicial — o controle nasce desmarcado, como no desenho, e é o
   * avanço que recusa.
   */
  acceptedTerms: z.boolean().refine((value) => value, "Aceite os termos para continuar."),
});

const stepThreeSchema = z.object({ congregations: congregationsSchema });

/**
 * O formulário inteiro, nas três etapas.
 *
 * As etapas são schemas próprios e este é a composição delas, em vez do
 * contrário: o avanço valida **uma** etapa por vez (`SIGNUP_STEPS[n].fields`),
 * e o envio valida o conjunto. Sem a composição, as regras existiriam duas
 * vezes e divergiriam na primeira mudança.
 *
 * A forma espelha o payload de `POST /auth/circuit-signups`, então o envio não
 * precisa de mapper — só normalizar o celular e descartar `acceptedTerms`.
 */
export const signupSchema = stepOneSchema.extend(stepTwoSchema.shape).extend(stepThreeSchema.shape);

export type SignupFormValues = z.infer<typeof signupSchema>;

/** Nome de campo raiz do formulário, aceito por `trigger` do React Hook Form. */
type SignupFieldName = keyof SignupFormValues;

interface SignupStep {
  /** Campos que o avanço valida nesta etapa. */
  fields: readonly SignupFieldName[];
  title: string;
  subtitle: string;
  /** Rótulo do botão que avança. */
  cta: string;
  /** Rótulo enquanto o avanço está em andamento. */
  busyCta: string;
}

/**
 * As três etapas, na ordem da tela. O índice do array é a etapa menos um; o
 * número que o usuário vê é `índice + 1`.
 */
export const SIGNUP_STEPS: readonly SignupStep[] = [
  {
    fields: ["coordinator"],
    title: "Cadastre seu circuito",
    subtitle: "Comece pelos seus dados. Você será o coordenador do arranjo de ônibus no circuito.",
    cta: "Continuar",
    busyCta: "Verificando…",
  },
  {
    fields: ["circuit", "acceptedTerms"],
    title: "Dados do circuito",
    subtitle: "Essas informações aparecem nos eventos, listas e convites.",
    cta: "Continuar",
    busyCta: "Verificando…",
  },
  {
    fields: ["congregations"],
    title: "Congregações do circuito",
    subtitle: "Comece pela sua congregação. As demais você pode adicionar agora ou depois.",
    cta: "Criar circuito",
    busyCta: "Criando circuito…",
  },
];

export const SIGNUP_STEP_COUNT = SIGNUP_STEPS.length;

/** Valores iniciais, com a congregação do coordenador já como primeira linha. */
export const signupDefaultValues: SignupFormValues = {
  coordinator: { name: "", email: "", phone: "", password: "" },
  circuit: { name: "", city: "", state: "" },
  acceptedTerms: false,
  congregations: [{ name: "", code: "" }],
};

type CongregationRow = SignupFormValues["congregations"][number];

/**
 * Tira as linhas adicionais que o usuário abriu e não preencheu.
 *
 * A primeira linha nunca sai — é a congregação do coordenador, e se estiver em
 * branco quem recusa é a validação, não esta função. Roda **antes** do envio,
 * sobre o próprio formulário, e não sobre o payload: a API devolve o conflito
 * como `congregations.N.code`, e esse `N` só aponta a linha certa na tela se a
 * lista enviada for a mesma que o usuário está vendo.
 */
export function dropBlankCongregations(congregations: readonly CongregationRow[]): CongregationRow[] {
  return congregations.filter(
    (congregation, index) => index === 0 || congregation.name.trim() !== "" || congregation.code.trim() !== "",
  );
}
