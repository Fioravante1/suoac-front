import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publish: vi.fn(), isPublishing: false, error: null as string | null }));
vi.mock("@/features/event/publish-event", () => ({ usePublishEvent: () => mocks }));
import { PublishEventActions } from "./publish-event-actions";

describe("PublishEventActions", () => {
  it("oferece edição e publicação", () => {
    render(<PublishEventActions eventId="e1" />);
    expect(screen.getByRole("link", { name: "Editar evento" })).toHaveAttribute("href", "/events/e1");
    fireEvent.click(screen.getByRole("button", { name: "Publicar e abrir inscrições" }));
    expect(mocks.publish).toHaveBeenCalled();
  });

  it("expõe falha e bloqueia o botão enquanto publica", () => {
    mocks.error = "Sem permissão";
    mocks.isPublishing = true;
    render(<PublishEventActions eventId="e1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sem permissão");
    expect(screen.getByRole("button", { name: "Publicando…" })).toBeDisabled();
  });
});
