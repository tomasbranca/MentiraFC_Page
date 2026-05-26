import toast from "react-hot-toast";

import { confirmAppAction } from "../../app/confirmDialog";

export const commentToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

export const confirmDeleteComment = () =>
  confirmAppAction({
    title: "Borrar comentario",
    text: "Esta accion no se puede deshacer.",
    confirmText: "Borrar",
    icon: "warning",
    variant: "danger",
  });

export const confirmModeratorDeleteComment = () =>
  confirmAppAction({
    title: "Eliminar comentario",
    text: "Vas a eliminar este comentario como moderador. Esta accion no se puede deshacer.",
    confirmText: "Eliminar",
    icon: "warning",
    variant: "danger",
  });

export const confirmSaveCommentEdit = () =>
  confirmAppAction({
    title: "Guardar cambios",
    text: "Se actualizara el texto de tu comentario.",
    confirmText: "Guardar",
    icon: "question",
    variant: "primary",
  });

export const confirmDiscardCommentEdit = () =>
  confirmAppAction({
    title: "Descartar cambios",
    text: "Si cancelas ahora, se perdera lo que editaste.",
    confirmText: "Descartar",
    icon: "warning",
    variant: "danger",
  });

export const runCommentMutationToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> =>
  toast.promise(promise, messages, commentToastOptions);
