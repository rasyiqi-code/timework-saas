'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { UserAvatar } from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { Settings, LogOut, CreditCard } from 'lucide-react';
import { useUser } from '@stackframe/stack';
import { Dictionary } from '@/i18n/dictionaries';

interface UserDropdownProps {
    dict: Dictionary;
}

export function UserDropdown({ dict }: UserDropdownProps) {
    const user = useUser();

    if (!user) return null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="outline-none flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <UserAvatar 
                        user={{
                            name: user.displayName || user.primaryEmail || '',
                            image: user.profileImageUrl
                        }}
                        size="sm" 
                    />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content 
                    className="z-[100] min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl animate-in fade-in zoom-in duration-200"
                    align="end"
                    sideOffset={8}
                >
                    <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.primaryEmail}
                        </p>
                    </div>

                    <DropdownMenu.Item asChild>
                        <Link 
                            href="/account-settings" 
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg outline-none transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            {dict.nav.accountSettings || 'Account settings'}
                        </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                        <Link 
                            href="/billing" 
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg outline-none transition-colors"
                        >
                            <CreditCard className="w-4 h-4" />
                            {dict.nav.billing || 'Subscription'}
                        </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    <DropdownMenu.Item 
                        onClick={() => user.signOut()}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg outline-none transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        {dict.nav.signOut || 'Sign out'}
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
