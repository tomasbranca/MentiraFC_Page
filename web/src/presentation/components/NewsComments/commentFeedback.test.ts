import { describe, expect, it, vi } from "vitest";

vi.mock("../../app/confirmDialog", () => ({
  confirmAppAction: vi.fn(),
}));

import { confirmAppAction } from "../../app/confirmDialog";
import {
  confirmDeleteComment,
  confirmDiscardCommentEdit,
  confirmSaveCommentEdit,
} from "./commentFeedback";

describe("commentFeedback", () => {
  it("pide confirmacion para borrar y guardar edicion", async () => {
    vi.mocked(confirmAppAction).mockResolvedValue(true);

    await expect(confirmDeleteComment()).resolves.toBe(true);
    await expect(confirmSaveCommentEdit()).resolves.toBe(true);
    await expect(confirmDiscardCommentEdit()).resolves.toBe(true);

    expect(confirmAppAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Borrar comentario",
        variant: "danger",
      })
    );
    expect(confirmAppAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Guardar cambios",
        variant: "primary",
      })
    );
  });
});
