import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { confirmDashboardAction } from "./DashboardConfirmDialog";

type UnsavedChangesGuardOptions = {
  when: boolean;
  title?: string;
  message?: string;
};

const defaultTitle = "Cambios sin guardar";
const defaultMessage =
  "Si salis ahora, se pierden los cambios que todavia no guardaste.";

export const useUnsavedChangesGuard = ({
  when,
  title = defaultTitle,
  message = defaultMessage,
}: UnsavedChangesGuardOptions) => {
  const navigate = useNavigate();
  const whenRef = useRef(when);
  const titleRef = useRef(title);
  const messageRef = useRef(message);

  useEffect(() => {
    whenRef.current = when;
    titleRef.current = title;
    messageRef.current = message;
  }, [message, title, when]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!whenRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!whenRef.current || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");

      if (!anchor || (anchor.target && anchor.target !== "_self")) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);

      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
      ) {
        return;
      }

      event.preventDefault();

      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: titleRef.current,
          text: messageRef.current,
          confirmText: "Salir sin guardar",
          cancelText: "Seguir editando",
          icon: "warning",
          variant: "danger",
        });

        if (confirmed) {
          navigate(`${url.pathname}${url.search}${url.hash}`);
        }
      })();
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [navigate]);
};
