'use client';

import * as Tooltip from '@radix-ui/react-tooltip';

export function SimpleTooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content
                    className="z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 max-w-[200px] text-center"
                    sideOffset={4}
                >
                    {content}
                    <Tooltip.Arrow className="fill-white dark:fill-slate-950" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    )
}
