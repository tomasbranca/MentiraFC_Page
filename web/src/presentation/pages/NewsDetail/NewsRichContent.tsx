import { PortableText } from "@portabletext/react";
import type { PortableTextReactComponents } from "@portabletext/react";
import type { TypedObject } from "@portabletext/types";
import type { ReactNode } from "react";

type ChildrenProps = {
  children?: ReactNode;
};

const portableTextComponents: Partial<PortableTextReactComponents> = {
  block: {
    normal: ({ children }: ChildrenProps) => (
      <p className="mb-4 text-base md:text-lg leading-relaxed text-neutral-200 whitespace-pre-line">
        {children}
      </p>
    ),
    h1: ({ children }: ChildrenProps) => (
      <h1 className="mb-4 text-3xl md:text-4xl font-extrabold normal-case text-white leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: ChildrenProps) => (
      <h2 className="mb-4 text-2xl md:text-3xl font-bold normal-case text-white leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: ChildrenProps) => (
      <h3 className="mb-3 text-xl md:text-2xl font-bold normal-case text-white leading-tight">
        {children}
      </h3>
    ),
    h4: ({ children }: ChildrenProps) => (
      <h4 className="mb-3 text-lg md:text-xl font-semibold normal-case text-white leading-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }: ChildrenProps) => (
      <blockquote className="my-4 border-l-4 border-violet-500 pl-4 italic text-neutral-300 whitespace-pre-line">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: ChildrenProps) => (
      <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }: ChildrenProps) => <em className="italic">{children}</em>,
    underline: ({ children }: ChildrenProps) => (
      <span className="underline">{children}</span>
    ),
  },
  list: {
    bullet: ({ children }: ChildrenProps) => (
      <ul className="my-4 ml-6 list-disc space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ul>
    ),
    number: ({ children }: ChildrenProps) => (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: ChildrenProps) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
    number: ({ children }: ChildrenProps) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
  },
  hardBreak: () => <br />,
};

type NewsRichContentProps = {
  content?: TypedObject | TypedObject[];
};

const NewsRichContent = ({ content }: NewsRichContentProps) => {
  return <PortableText value={content ?? []} components={portableTextComponents} />;
};

export default NewsRichContent;
