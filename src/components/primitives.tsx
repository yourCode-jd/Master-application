"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";
import { MoreHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

export function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <Tooltip.Root><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="ui-tooltip" sideOffset={8}>{label}<Tooltip.Arrow className="ui-tooltip-arrow" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}

export function ActionMenu({ label = "More actions", children }: { label?: string; children: ReactNode }) {
  return <DropdownMenu.Root><DropdownMenu.Trigger className="icon-btn" aria-label={label}><MoreHorizontal aria-hidden="true" /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="ui-menu" align="end" sideOffset={8}>{children}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}
export const ActionMenuItem = DropdownMenu.Item;

export function AppDialog({ trigger, title, description, children }: { trigger: ReactNode; title: string; description?: string; children: ReactNode }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="ui-dialog-overlay"/><Dialog.Content className="ui-dialog"><div className="ui-dialog-heading"><div><Dialog.Title>{title}</Dialog.Title>{description && <Dialog.Description>{description}</Dialog.Description>}</div><Dialog.Close className="icon-btn" aria-label="Close"><X aria-hidden="true" /></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export { Popover, Tabs };
