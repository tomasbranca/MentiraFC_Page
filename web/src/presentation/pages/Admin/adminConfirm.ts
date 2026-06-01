import Swal from "sweetalert2";

type AdminConfirmOptions = {
  title: string;
  text?: string;
  confirmButtonText?: string;
  danger?: boolean;
};

export const confirmAdminAction = async ({
  title,
  text,
  confirmButtonText = "Confirmar",
  danger = false,
}: AdminConfirmOptions): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor: danger ? "#b91c1c" : "#6d28d9",
    cancelButtonColor: "#525252",
  });

  return result.isConfirmed;
};
