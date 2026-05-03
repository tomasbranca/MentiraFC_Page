import { type ReactNode, useId } from "react";
import { Link } from "react-router-dom";
import type { RosterNavigationItem } from "./rosterNavigation.utils";

type RosterNavigationProps = {
  desktopMaxHeight?: number | null;
  items: RosterNavigationItem[];
  renderCard: (item: RosterNavigationItem) => ReactNode;
  title?: string;
};

const SCROLLBAR_CLASS_NAME = [
  "[scrollbar-color:#6d28d9_#262626]",
  "[scrollbar-width:thin]",
  "[&::-webkit-scrollbar]:w-2",
  "[&::-webkit-scrollbar-track]:rounded-full",
  "[&::-webkit-scrollbar-track]:bg-neutral-800",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-violet-700",
  "hover:[&::-webkit-scrollbar-thumb]:bg-violet-500",
].join(" ");

const getListLinkClassName = (isActive: boolean) =>
  [
    "group relative flex min-w-0 items-center gap-2 py-1.5 pl-3 pr-2 text-sm transition-colors",
    isActive
      ? "bg-violet-100 text-violet-950"
      : "text-neutral-700 hover:bg-violet-50 hover:text-violet-950",
  ].join(" ");

const getMobileCardWrapperClassName = (isActive: boolean) =>
  [
    "relative",
    "transition-transform duration-300",
    isActive ? undefined : "hover:-translate-y-1",
  ].join(" ");

const RosterNavigation = ({
  desktopMaxHeight,
  items,
  renderCard,
  title = "Mas perfiles",
}: RosterNavigationProps) => {
  const id = useId();
  const desktopStyle = desktopMaxHeight
    ? { height: `${desktopMaxHeight}px`, maxHeight: `${desktopMaxHeight}px` }
    : undefined;
  const shouldRenderDesktopList =
    typeof desktopMaxHeight === "number" && desktopMaxHeight > 0;

  if (!items.length) return null;

  return (
    <>
      {shouldRenderDesktopList && (
        <aside
          className="hidden min-h-0 overflow-hidden border-l border-neutral-300 pl-6 lg:flex lg:flex-col"
          aria-labelledby={`${id}-desktop-title`}
          style={desktopStyle}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <h2
              id={`${id}-desktop-title`}
              className="text-lg font-black tracking-tight text-violet-900"
            >
              {title}
            </h2>

            <nav
              className="mt-3 min-h-0 flex-1 overflow-hidden"
              aria-label={title}
            >
              <ul
                className={`${SCROLLBAR_CLASS_NAME} h-full space-y-0.5 overflow-y-auto pr-2`}
              >
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      aria-current={item.isActive ? "page" : undefined}
                      className={getListLinkClassName(item.isActive)}
                      title={item.label}
                    >
                      {item.isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 bg-violet-700"
                        />
                      )}
                      <span className="w-14 shrink-0 truncate text-[10px] font-black uppercase leading-none text-violet-700">
                        {item.eyebrow}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      )}

      <section
        className="bg-neutral-900 px-4 py-5 sm:px-6 lg:hidden"
        aria-labelledby={`${id}-mobile-title`}
      >
        <h2
          id={`${id}-mobile-title`}
          className="mb-3 text-xl font-black tracking-tight text-violet-50"
        >
          {title}
        </h2>

        <nav aria-label={title}>
          <ul
            className={`${SCROLLBAR_CLASS_NAME} flex snap-x gap-4 overflow-x-auto pb-4`}
          >
            {items.map((item) => (
              <li
                key={item.id}
                className="w-[72vw] max-w-[18rem] shrink-0 snap-start sm:w-[16rem]"
              >
                <div
                  aria-current={item.isActive ? "page" : undefined}
                  className={getMobileCardWrapperClassName(item.isActive)}
                >
                  {renderCard(item)}
                  {item.isActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-40 border-2 border-violet-600"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  );
};

export default RosterNavigation;
