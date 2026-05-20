import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
} from "@portabletext/editor";
import type {
  PortableTextBlock as EditorPortableTextBlock,
  RenderAnnotationFunction,
  RenderDecoratorFunction,
  RenderStyleFunction,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import * as selectors from "@portabletext/editor/selectors";
import { useMemo, useState, type ReactNode } from "react";
import type { PortableTextBlock } from "@portabletext/types";
import {
  FiBold,
  FiCheck,
  FiHash,
  FiItalic,
  FiLink,
  FiList,
  FiMessageSquare,
  FiType,
  FiUnderline,
  FiX,
} from "react-icons/fi";

type DashboardNewsRichTextEditorProps = {
  value: PortableTextBlock[];
  onChange: (value: PortableTextBlock[]) => void;
};

const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }],
  styles: [
    { name: "normal" },
    { name: "h2" },
    { name: "h3" },
    { name: "blockquote" },
  ],
  annotations: [
    {
      name: "link",
      fields: [{ name: "href", type: "string" }],
    },
  ],
  lists: [{ name: "bullet" }, { name: "number" }],
  inlineObjects: [],
  blockObjects: [],
});

const renderStyle: RenderStyleFunction = ({ schemaType, children }) => {
  if (schemaType.value === "h2") {
    return <h2 className="text-2xl font-bold leading-tight text-white">{children}</h2>;
  }

  if (schemaType.value === "h3") {
    return <h3 className="text-xl font-bold leading-tight text-white">{children}</h3>;
  }

  if (schemaType.value === "blockquote") {
    return (
      <blockquote className="border-l-4 border-violet-400 pl-4 italic text-violet-100/85">
        {children}
      </blockquote>
    );
  }

  return <p className="text-sm leading-relaxed text-white sm:text-base">{children}</p>;
};

const renderDecorator: RenderDecoratorFunction = ({ value, children }) => {
  if (value === "strong") {
    return <strong className="font-bold text-white">{children}</strong>;
  }

  if (value === "em") {
    return <em className="italic">{children}</em>;
  }

  if (value === "underline") {
    return <span className="underline underline-offset-4">{children}</span>;
  }

  return <>{children}</>;
};

const renderAnnotation: RenderAnnotationFunction = ({ value, children }) => (
  <span
    className="rounded-sm bg-violet-400/15 text-violet-100 underline decoration-violet-300 underline-offset-4"
    title={typeof value.href === "string" ? value.href : undefined}
  >
    {children}
  </span>
);

const ToolbarButton = ({
  active,
  disabled,
  label,
  children,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[3px] border px-2 text-xs font-semibold transition ${
      active
        ? "border-violet-300 bg-violet-200 text-violet-950"
        : "border-white/10 bg-black/20 text-violet-100 hover:border-violet-200/35 hover:bg-white/[0.05]"
    } disabled:cursor-not-allowed disabled:opacity-45`}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);

const Toolbar = () => {
  const editor = useEditor();
  const isH2 = useEditorSelector(editor, selectors.isActiveStyle("h2"));
  const isH3 = useEditorSelector(editor, selectors.isActiveStyle("h3"));
  const isQuote = useEditorSelector(
    editor,
    selectors.isActiveStyle("blockquote")
  );
  const isBold = useEditorSelector(editor, selectors.isActiveDecorator("strong"));
  const isItalic = useEditorSelector(editor, selectors.isActiveDecorator("em"));
  const isUnderline = useEditorSelector(
    editor,
    selectors.isActiveDecorator("underline")
  );
  const isBullet = useEditorSelector(
    editor,
    selectors.isActiveListItem("bullet")
  );
  const isNumber = useEditorSelector(
    editor,
    selectors.isActiveListItem("number")
  );
  const isSelectionExpanded = useEditorSelector(
    editor,
    selectors.isSelectionExpanded
  );
  const activeAnnotations = useEditorSelector(
    editor,
    selectors.getActiveAnnotations
  );
  const activeLink = activeAnnotations.find((annotation) => annotation._type === "link");
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [href, setHref] = useState("");

  const toggleStyle = (style: "normal" | "h2" | "h3" | "blockquote") => {
    editor.send({ type: "style.toggle", style });
    editor.send({ type: "focus" });
  };

  const toggleDecorator = (decorator: "strong" | "em" | "underline") => {
    editor.send({ type: "decorator.toggle", decorator });
    editor.send({ type: "focus" });
  };

  const toggleList = (listItem: "bullet" | "number") => {
    editor.send({ type: "list item.toggle", listItem });
    editor.send({ type: "focus" });
  };

  const openLinkPanel = () => {
    setHref(typeof activeLink?.href === "string" ? activeLink.href : "");
    setIsLinkPanelOpen((current) => !current);
  };

  const removeActiveLink = () => {
    if (!activeLink || typeof activeLink.href !== "string") {
      return;
    }

    editor.send({
      type: "annotation.toggle",
      annotation: {
        name: "link",
        value: { href: activeLink.href },
      },
    });
    editor.send({ type: "focus" });
  };

  const applyLink = () => {
    const nextHref = href.trim();

    if (!nextHref) {
      removeActiveLink();
      setIsLinkPanelOpen(false);
      return;
    }

    if (activeLink && typeof activeLink.href === "string") {
      removeActiveLink();
    }

    editor.send({
      type: "annotation.toggle",
      annotation: {
        name: "link",
        value: { href: nextHref },
      },
    });
    editor.send({ type: "focus" });
    setIsLinkPanelOpen(false);
  };

  return (
    <div className="border-b border-white/10 p-3">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton label="Párrafo" onClick={() => toggleStyle("normal")}>
          <FiType className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Título H2" active={isH2} onClick={() => toggleStyle("h2")}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Título H3" active={isH3} onClick={() => toggleStyle("h3")}>
          H3
        </ToolbarButton>
        <ToolbarButton
          label="Cita"
          active={isQuote}
          onClick={() => toggleStyle("blockquote")}
        >
          <FiMessageSquare className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Negrita"
          active={isBold}
          onClick={() => toggleDecorator("strong")}
        >
          <FiBold className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          active={isItalic}
          onClick={() => toggleDecorator("em")}
        >
          <FiItalic className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Subrayado"
          active={isUnderline}
          onClick={() => toggleDecorator("underline")}
        >
          <FiUnderline className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Viñetas"
          active={isBullet}
          onClick={() => toggleList("bullet")}
        >
          <FiList className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Numerada"
          active={isNumber}
          onClick={() => toggleList("number")}
        >
          <FiHash className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Enlace"
          active={Boolean(activeLink)}
          disabled={!activeLink && !isSelectionExpanded}
          onClick={openLinkPanel}
        >
          <FiLink className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </div>

      {isLinkPanelOpen && (
        <div className="mt-3 flex flex-col gap-2 rounded-[4px] border border-white/10 bg-black/20 p-3 sm:flex-row">
          <input
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="https://... o /noticias/..."
            className="min-h-10 min-w-0 flex-1 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
          />
          <div className="flex gap-2">
            <ToolbarButton label="Aplicar enlace" onClick={applyLink}>
              <FiCheck className="size-4" aria-hidden="true" />
            </ToolbarButton>
            {activeLink && (
              <ToolbarButton label="Quitar enlace" onClick={removeActiveLink}>
                <FiX className="size-4" aria-hidden="true" />
              </ToolbarButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardNewsRichTextEditor = ({
  value,
  onChange,
}: DashboardNewsRichTextEditorProps) => {
  const initialValue = useMemo(
    () => value as unknown as EditorPortableTextBlock[],
    [value]
  );

  return (
    <div className="overflow-hidden rounded-[4px] border border-white/10 bg-black/15">
      <EditorProvider
        initialConfig={{
          schemaDefinition,
          initialValue,
        }}
      >
        <EventListenerPlugin
          on={(event) => {
            if (event.type === "mutation") {
              onChange((event.value ?? []) as unknown as PortableTextBlock[]);
            }
          }}
        />
        <Toolbar />
        <PortableTextEditable
          className="min-h-40 space-y-4 px-4 py-4 outline-none"
          renderStyle={renderStyle}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderBlock={({ children }) => <div>{children}</div>}
          renderListItem={({ children }) => <>{children}</>}
          renderPlaceholder={() => (
            <span className="text-violet-100/45">
              Escribí el contenido de la noticia...
            </span>
          )}
        />
      </EditorProvider>
    </div>
  );
};

export default DashboardNewsRichTextEditor;
