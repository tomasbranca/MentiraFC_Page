import { useEffect, useId, useRef, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";

type CommentMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
};

type CommentActionsMenuProps = {
  items: CommentMenuItem[];
  ariaLabel?: string;
};

const CommentActionsMenu = ({
  items,
  ariaLabel = "Opciones del comentario",
}: CommentActionsMenuProps) => {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = items.filter((item) => !item.disabled);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-800/80 hover:text-neutral-200"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <FiMoreHorizontal className="size-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-40 bg-neutral-800 py-1 shadow-lg"
        >
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-neutral-700/80 ${
                item.tone === "danger"
                  ? "text-red-300 hover:text-red-200"
                  : "text-neutral-200"
              }`}
              onClick={() => {
                setIsOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CommentActionsMenu;
