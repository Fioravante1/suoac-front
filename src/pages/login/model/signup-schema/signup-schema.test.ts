import { describe, expect, it } from "vitest";

import {
  SIGNUP_STEPS,
  SIGNUP_STEP_COUNT,
  buildSignupSummary,
  dropBlankCongregations,
  signupDefaultValues,
  signupSchema,
} from "./signup-schema";

// ── Helpers ──────────────────────────────────────────────────────
function buildValues(overrides: Record<string, unknown> = {}) {
  return {
    coordinator: {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(19) 99999-9999",
      password: "Senha-Segura123",
    },
    circuit: { name: "SP-17", city: "Campinas", state: "SP" },
    acceptedTerms: true,
    congregations: [{ name: "Central", code: "SP17-CENTRAL" }],
    ...overrides,
  };
}

/** Caminhos que falharam, como `circuit.name`, para a asserção ficar legível. */
function failedPaths(values: Record<string, unknown>): string[] {
  const result = signupSchema.safeParse(values);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join("."));
}

// ── Test Suite ───────────────────────────────────────────────────
describe("signupSchema", () => {
  it("deve aceitar um cadastro completo", () => {
    expect(signupSchema.safeParse(buildValues()).success).toBe(true);
  });

  describe("coordenador", () => {
    it("deve aceitar celular com e sem máscara", () => {
      const masked = buildValues({ coordinator: { ...buildValues().coordinator, phone: "(19) 99999-9999" } });
      const plain = buildValues({ coordinator: { ...buildValues().coordinator, phone: "19999999999" } });

      // O campo é exibido com máscara, e o mesmo número digitado sem ela
      // precisa valer igual — a validação conta dígitos, não formato.
      expect(signupSchema.safeParse(masked).success).toBe(true);
      expect(signupSchema.safeParse(plain).success).toBe(true);
    });

    it("deve aceitar fixo de 10 dígitos", () => {
      const values = buildValues({ coordinator: { ...buildValues().coordinator, phone: "(19) 3333-4444" } });

      expect(signupSchema.safeParse(values).success).toBe(true);
    });

    it("deve recusar celular incompleto", () => {
      const values = buildValues({ coordinator: { ...buildValues().coordinator, phone: "99999-999" } });

      expect(failedPaths(values)).toContain("coordinator.phone");
    });

    it("deve recusar senha que a API recusaria", () => {
      const values = buildValues({ coordinator: { ...buildValues().coordinator, password: "senhasenhasenha" } });

      // Mesma política do backend, importada de `shared/lib/password-policy`.
      expect(failedPaths(values)).toContain("coordinator.password");
    });

    it("deve recusar e-mail malformado", () => {
      const values = buildValues({ coordinator: { ...buildValues().coordinator, email: "joao@" } });

      expect(failedPaths(values)).toContain("coordinator.email");
    });
  });

  describe("circuito", () => {
    it("deve guardar o identificador em maiúsculas", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, name: " sp-17 " } });
      const result = signupSchema.parse(values);

      expect(result.circuit.name).toBe("SP-17");
    });

    it("deve aceitar o formato real com espaço", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, name: "SP-019 A" } });

      expect(signupSchema.safeParse(values).success).toBe(true);
    });

    it("deve exigir o circuito", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, name: "" } });

      expect(failedPaths(values)).toContain("circuit.name");
    });

    it("deve respeitar o limite da compatibilidade transitória", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, name: "CIRCUITO-COM-MAIS-DE-20" } });

      expect(failedPaths(values)).toContain("circuit.name");
    });

    it("deve guardar a UF em maiúsculas", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, state: "sp" } });

      expect(signupSchema.parse(values).circuit.state).toBe("SP");
    });

    it("deve exigir UF de duas letras", () => {
      const values = buildValues({ circuit: { ...buildValues().circuit, state: "SAO" } });

      expect(failedPaths(values)).toContain("circuit.state");
    });
  });

  describe("localização", () => {
    it.each(["", " ", "S", "SAO", "12", "S1", "ÁB"])("deve recusar UF inválida: %s", (state) => {
      expect(failedPaths(buildValues({ circuit: { name: "SP-019 A", city: "Campinas", state } }))).toContain(
        "circuit.state",
      );
    });

    it.each(["", " ", "A", "a".repeat(101)])("deve recusar cidade vazia, curta ou longa: %s", (city) => {
      expect(failedPaths(buildValues({ circuit: { name: "SP-019 A", city, state: "SP" } }))).toContain("circuit.city");
    });

    it("deve aceitar cidade com acento e remover espaços das extremidades", () => {
      const result = signupSchema.parse(
        buildValues({ circuit: { name: " sp-019 a ", city: " São Paulo ", state: "sp" } }),
      );
      expect(result.circuit).toEqual({ name: "SP-019 A", city: "São Paulo", state: "SP" });
    });
  });

  describe("termos", () => {
    it("deve recusar o cadastro sem aceite", () => {
      expect(failedPaths(buildValues({ acceptedTerms: false }))).toContain("acceptedTerms");
    });
  });

  describe("congregações", () => {
    it("deve exigir nome e código da primeira, que é a do coordenador", () => {
      const paths = failedPaths(buildValues({ congregations: [{ name: "", code: "" }] }));

      expect(paths).toContain("congregations.0.name");
      expect(paths).toContain("congregations.0.code");
    });

    it("deve aceitar linha adicional em branco", () => {
      const values = buildValues({
        congregations: [
          { name: "Central", code: "SP17-CENTRAL" },
          { name: "", code: "" },
        ],
      });

      // Linha vazia é só uma linha que o usuário abriu e não usou.
      expect(signupSchema.safeParse(values).success).toBe(true);
    });

    it("deve exigir código quando a linha adicional tem nome", () => {
      const values = buildValues({
        congregations: [
          { name: "Central", code: "SP17-CENTRAL" },
          { name: "Jardim", code: "" },
        ],
      });

      expect(failedPaths(values)).toContain("congregations.1.code");
    });

    it("deve aceitar código digitado em minúsculas", () => {
      const values = buildValues({ congregations: [{ name: "Central", code: "sp17-central" }] });
      const result = signupSchema.safeParse(values);

      // O padrão da API só aceita maiúsculas; recusar aqui mandaria o usuário
      // corrigir algo que a tela deveria normalizar sozinha.
      expect(result.success).toBe(true);
      expect(result.success && result.data.congregations[0]?.code).toBe("SP17-CENTRAL");
    });

    it("deve apontar a linha repetida, não a raiz da lista", () => {
      const result = signupSchema.safeParse(
        buildValues({
          congregations: [
            { name: "Central", code: "SP17-A" },
            { name: "Jardim", code: "SP17-A" },
          ],
        }),
      );

      // Erro sem caminho de linha é erro que a tela não consegue mostrar: o
      // avanço para e o usuário não vê motivo nenhum.
      expect(result.success).toBe(false);
      expect(result.success === false && result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "congregations.1.code",
      );
    });

    it("deve recusar o mesmo código em duas linhas", () => {
      const values = buildValues({
        congregations: [
          { name: "Central", code: "SP17-A" },
          { name: "Jardim", code: "SP17-A" },
        ],
      });

      // A API responde 422 para isto, e cada envio gasta uma das poucas
      // tentativas que o limite por e-mail concede.
      expect(signupSchema.safeParse(values).success).toBe(false);
    });

    it("deve exigir ao menos a congregação do coordenador", () => {
      expect(signupSchema.safeParse(buildValues({ congregations: [] })).success).toBe(false);
    });
  });
});

describe("SIGNUP_STEPS", () => {
  it("deve ter três etapas", () => {
    expect(SIGNUP_STEP_COUNT).toBe(3);
    expect(SIGNUP_STEPS).toHaveLength(3);
  });

  it("deve cobrir todos os campos do formulário entre as etapas", () => {
    const covered = SIGNUP_STEPS.flatMap((step) => step.fields);

    // Campo fora de toda etapa nunca seria validado no avanço, e só reprovaria
    // no envio — depois de o usuário achar que terminou.
    expect([...covered].sort()).toEqual(Object.keys(signupDefaultValues).sort());
  });

  it("não deve repetir um campo em duas etapas", () => {
    const covered = SIGNUP_STEPS.flatMap((step) => step.fields);

    expect(new Set(covered).size).toBe(covered.length);
  });

  it("deve chamar a última etapa de criação, não de continuação", () => {
    expect(SIGNUP_STEPS[2]?.cta).toBe("Criar circuito");
    expect(SIGNUP_STEPS[0]?.cta).toBe("Continuar");
  });
});

describe("dropBlankCongregations", () => {
  it("deve tirar as linhas adicionais em branco e manter a ordem das demais", () => {
    const rows = [
      { name: "Central", code: "SP17" },
      { name: "", code: "" },
      { name: "Taquaral", code: "SP18" },
      { name: "  ", code: " " },
    ];

    expect(dropBlankCongregations(rows)).toEqual([
      { name: "Central", code: "SP17" },
      { name: "Taquaral", code: "SP18" },
    ]);
  });

  it("deve manter a primeira linha mesmo em branco, para a validação recusá-la", () => {
    expect(dropBlankCongregations([{ name: "", code: "" }])).toEqual([{ name: "", code: "" }]);
  });

  it("deve manter a linha só com o nome, para a validação apontar o código", () => {
    const rows = [
      { name: "Central", code: "SP17" },
      { name: "Taquaral", code: "" },
    ];

    expect(dropBlankCongregations(rows)).toEqual(rows);
  });
});

describe("buildSignupSummary", () => {
  it("deve montar o resumo normalizando circuito, UF e código da congregação própria", () => {
    const summary = buildSignupSummary({
      coordinator: {
        name: "  João Silva  ",
        email: "joao@example.com",
        phone: "(19) 99999-9999",
        password: "Senha@Segura123",
      },
      circuit: { name: " sp-17 ", city: " Campinas ", state: "sp" },
      acceptedTerms: true,
      congregations: [{ name: " Central ", code: " sp17-central " }],
    });

    expect(summary).toEqual({
      circuitName: "SP-17",
      rows: [
        { label: "Coordenador", value: "João Silva" },
        { label: "Circuito", value: "SP-17 · Campinas/SP" },
        { label: "Sua congregação", value: "Central · SP17-CENTRAL" },
        { label: "Congregações", value: "1 cadastrada" },
        { label: "Próximo passo", value: "Criar o primeiro evento" },
      ],
    });
  });

  it("deve exibir o plural na contagem de congregações e ignorar linhas adicionais em branco", () => {
    const summary = buildSignupSummary({
      coordinator: {
        name: "João Silva",
        email: "joao@example.com",
        phone: "(19) 99999-9999",
        password: "Senha@Segura123",
      },
      circuit: { name: "SP-17", city: "Campinas", state: "SP" },
      acceptedTerms: true,
      congregations: [
        { name: "Central", code: "10540" },
        { name: "Taquaral", code: "10541" },
        { name: "", code: "" },
        { name: "Cambuí", code: "10542" },
      ],
    });

    expect(summary.rows).toContainEqual({ label: "Congregações", value: "3 cadastradas" });
  });
});
