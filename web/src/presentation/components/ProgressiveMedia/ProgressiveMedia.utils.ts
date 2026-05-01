const POSITION_CLASS_PATTERN = /(^|\s)(static|fixed|absolute|relative|sticky)(?=\s|$)/;

export const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const getProgressiveMediaWrapperClassName = (
  wrapperClassName?: string
) =>
  joinClasses(
    POSITION_CLASS_PATTERN.test(wrapperClassName ?? "") ? undefined : "relative",
    "overflow-hidden",
    wrapperClassName
  );
