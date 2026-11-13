import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signOutAction: vi.fn(), toastError: vi.fn() }));

vi.mock("@/features/sign-in", () => ({ signOutAction: mocks.signOutAction }));
vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ error: mocks.toastError }) }));

import { useSignOut } from "./use-sign-out";

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama a saída e fica ocupado enquanto ela não termina", async () => {
    let finish: () => void = () => {};
    mocks.signOutAction.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useSignOut());

    act(() => result.current.signOut());

    expect(mocks.signOutAction).toHaveBeenCalledOnce();
    expect(result.current.isSigningOut).toBe(true);

    await act(async () => finish());

    expect(result.current.isSigningOut).toBe(false);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("com falha de rede, avisa o motivo e devolve o controle a quem está na tela", async () => {
    mocks.signOutAction.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useSignOut());

    act(() => result.current.signOut());

    await waitFor(() => expect(result.current.isSigningOut).toBe(false));
    expect(mocks.toastError).toHaveBeenCalledWith("Não foi possível sair. Verifique sua conexão e tente de novo.");
  });

  it("trata o redirect para a entrada como sucesso, sem mostrar falha", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/login;307;" });
    mocks.signOutAction.mockRejectedValue(redirect);
    const { result } = renderHook(() => useSignOut());

    act(() => result.current.signOut());

    await waitFor(() => expect(result.current.isSigningOut).toBe(false));
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("ignora um segundo pedido enquanto a saída está a caminho", () => {
    mocks.signOutAction.mockReturnValue(new Promise<void>(() => {}));
    const { result } = renderHook(() => useSignOut());

    act(() => result.current.signOut());
    act(() => result.current.signOut());

    expect(mocks.signOutAction).toHaveBeenCalledOnce();
  });
});
