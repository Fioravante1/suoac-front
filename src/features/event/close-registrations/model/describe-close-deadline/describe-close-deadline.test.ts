import { describe, expect, it } from "vitest";

import { describeCloseDeadline } from "./describe-close-deadline";

// "Inscrições até 12/10/2026", uma segunda-feira, como a API grava o prazo.
const deadline = "2026-10-13T02:59:59.999Z";

describe("describeCloseDeadline", () => {
  it("diz o dia da semana e a data do prazo, sem o -feira, como no v3", () => {
    expect(describeCloseDeadline(deadline, "2026-10-07")).toBe("O prazo vai até segunda, 12/10.");
  });

  it("escreve sábado e domingo como são", () => {
    expect(describeCloseDeadline("2026-10-11T02:59:59.999Z", "2026-10-07")).toBe("O prazo vai até sábado, 10/10.");
  });

  it("diz hoje no próprio dia do prazo", () => {
    expect(describeCloseDeadline(deadline, "2026-10-12")).toBe("O prazo vai até hoje, 12/10.");
  });

  it("diz que o prazo venceu quando o evento ainda está aberto depois dele", () => {
    expect(describeCloseDeadline(deadline, "2026-10-13")).toBe("O prazo venceu em 12/10.");
  });
});
