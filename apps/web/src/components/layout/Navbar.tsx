'use client';

import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { UserButton } from "@stackframe/stack";

import { LanguageToggle } from '../language/LanguageToggle';
import { usePathname } from 'next/navigation';
import { Dictionary } from '@/i18n/dictionaries'; // Assuming Dictionary type is needed for props
import { CheckSquare } from 'lucide-react';

/** Tipe data user yang dibutuhkan oleh Navbar */
interface NavbarUser {
    name: string | null;
    role: string;
    organization?: { name: string } | null;
}

// Navbar now expects dict and locale as props, as it's a client component
export function Navbar({ dict, locale, signInUrl, currentUser, canSeeFileManager }: {
    dict: Dictionary,
    locale: string,
    signInUrl: string,
    currentUser: NavbarUser | null,
    canSeeFileManager?: boolean
}) {
    const pathname = usePathname();

    // Hide global navbar on landing page (root)
    if (pathname === '/') return null;

    return (
        <div
            className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800"
            // @ts-expect-error - App region non-standard property
            style={{ WebkitAppRegion: 'drag', appRegion: 'drag' }}
        >
            <nav className="max-w-7xl mx-auto h-12 flex items-center justify-between px-4">
                <Link
                    href="/"
                    className="text-sm font-bold text-slate-800 flex items-center gap-2 hover:opacity-80 transition-opacity dark:text-slate-100"
                    // @ts-expect-error - App region non-standard property
                    style={{ WebkitAppRegion: 'no-drag' }}
                >
                    <div className="w-5 h-5 rounded bg-[#4f46e5] flex items-center justify-center text-white">
                        <CheckSquare size={13} strokeWidth={3} />
                    </div>
                    {currentUser?.organization ? currentUser.organization.name : dict.nav.brand}
                </Link>
                {currentUser?.organization && (
                    <div className="hidden sm:flex items-center ml-2">
                        <span className="text-slate-300 dark:text-slate-700 mx-2">/</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {currentUser.organization.name}
                        </span>
                    </div>
                )}

                <div
                    className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                    // @ts-expect-error - App region non-standard property
                    style={{ WebkitAppRegion: 'no-drag' }}
                >
                    <Link href="/projects" className="px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        {dict.nav.projects}
                    </Link>
                    <Link href="/my-tasks" className="px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        {dict.nav.myTasks}
                    </Link>
                    <Link href="/insight" className="px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        {dict.nav.insight}
                    </Link>
                    {canSeeFileManager && (
                        <Link href="/files" className="px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-100">
                            {dict.nav.fileManager}
                        </Link>
                    )}
                    <Link href="/notes" className="px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        Notes
                    </Link>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                        <>
                            <Link href="/admin/protocols" className={`px-3 py-1.5 rounded transition-all ${pathname === '/admin/protocols' ? 'bg-[#4f46e5]/10 text-[#4f46e5] font-bold' : 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}>
                                {dict.nav.protocols}
                            </Link>
                            <Link href="/admin/projects/trash" className={`px-3 py-1.5 rounded transition-all ${pathname === '/admin/projects/trash' ? 'bg-[#4f46e5]/10 text-[#4f46e5] font-bold' : 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}>
                                {dict.nav.trash || 'Sampah'}
                            </Link>
                        </>
                    )}

                    {currentUser?.role === 'SUPER_ADMIN' && (
                        <Link href="/super-admin" className="px-3 py-1.5 rounded bg-blue-50 text-[#052e62] hover:bg-blue-100 transition-all font-bold dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                            {dict.nav.superAdmin}
                        </Link>
                    )}
                </div>

                <div
                    className="flex items-center gap-4"
                    // @ts-expect-error - App region non-standard property
                    style={{ WebkitAppRegion: 'no-drag' }}
                >
                    {currentUser ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium hidden md:inline-block text-slate-500 dark:text-slate-400">
                                {currentUser.name}
                            </span>
                            <UserButton />
                        </div>
                    ) : (
                        <Link
                            href={signInUrl}
                            className="text-xs font-bold px-3 py-1.5 rounded bg-[#4f46e5] text-white hover:bg-[#3730a3] transition-colors"
                        >
                            {dict.nav.signIn}
                        </Link>
                    )}
                    <LanguageToggle currentLocale={locale as "id" | "en"} />
                    <ThemeToggle />
                </div>
            </nav>
        </div>
    );
}
