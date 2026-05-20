import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";

import "sweetalert2/dist/sweetalert2.min.css";
import "./confirmDialog.css";

type ConfirmDialogVariant = "primary" | "danger";

type ConfirmDashboardActionOptions = {
  title: string;
  text: string;
  confirmText: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
  variant?: ConfirmDialogVariant;
};

const getConfirmButtonClassName = (variant: ConfirmDialogVariant) =>
  [
    "mfc-confirm-button",
    variant === "danger"
      ? "mfc-confirm-button--danger"
      : "mfc-confirm-button--primary",
  ].join(" ");

const buildCustomClass = (
  variant: ConfirmDialogVariant
): SweetAlertOptions["customClass"] => ({
  container: "mfc-confirm-container",
  popup: "mfc-confirm-popup",
  title: "mfc-confirm-title",
  htmlContainer: "mfc-confirm-text",
  actions: "mfc-confirm-actions",
  confirmButton: getConfirmButtonClassName(variant),
  cancelButton: "mfc-confirm-button mfc-confirm-button--secondary",
});

const dashboardConfirm = Swal.mixin({
  buttonsStyling: false,
  showCancelButton: true,
  reverseButtons: true,
  heightAuto: false,
  background: "#151518",
  color: "#f8f7ff",
  cancelButtonText: "Cancelar",
  focusCancel: true,
});

export const confirmDashboardAction = async ({
  title,
  text,
  confirmText,
  cancelText = "Cancelar",
  icon = "question",
  variant = "primary",
}: ConfirmDashboardActionOptions): Promise<boolean> => {
  const result = await dashboardConfirm.fire({
    title,
    text,
    icon,
    iconColor: variant === "danger" ? "#fecaca" : "#c4b5fd",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: buildCustomClass(variant),
  });

  return result.isConfirmed;
};
