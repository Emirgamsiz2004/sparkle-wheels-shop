import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useKeyboardSafeViewport } from "./use-keyboard-safe-viewport";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

describe("keyboard viewport", () => {
  function setup(height: number, offsetTop = 0) {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(852);
    vi.stubGlobal("visualViewport", {
      height, offsetTop, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as VisualViewport);
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    return renderHook(() => useKeyboardSafeViewport()).result.current;
  }

  it("does not invent a gap when an input is focused without a keyboard", () => {
    const viewport = setup(852);
    expect(viewport.isInputFocused).toBe(true);
    expect(viewport.focusedInset).toBe(0);
    expect(viewport.bottomInset).toBe(0);
  });

  it("uses only the measured keyboard height including viewport panning", () => {
    const viewport = setup(552, 40);
    expect(viewport.bottomInset).toBe(260);
    expect(viewport.height).toBe(552);
  });
});