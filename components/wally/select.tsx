import type { ComponentProps } from "react";
import { Icon } from "./icon";

/** Native keyboard and mobile behavior, with a progressively enhanced picker. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return <span className={`wally-select${className ? ` ${className}` : ""}`}>
    <select {...props} className="wally-select-control">{children}</select>
    <Icon name="chevronDown" size={17} className="wally-select-chevron" />
  </span>;
}
