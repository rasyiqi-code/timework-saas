import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
    user?: {
        id?: string;
        name?: string | null;
        image?: string | null; // Prepared for future use
    } | null;
    className?: string; // For sizing (w-6 h-6), margins (-ml-2), ring, etc.
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function UserAvatar({ user, className = "", size = 'md' }: UserAvatarProps) {
    const name = user?.name || "User";
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || "?";

    // Consistent color hashing or just distinct default
    // For now, consistent indigo/slate theme to match existing UI
    // We can add a simple hash function later if we want distinct colors per user

    const sizeClasses = {
        xs: "w-4 h-4 text-[7px]",
        sm: "w-5 h-5 text-[9px]",
        md: "w-6 h-6 text-[10px]",
        lg: "w-8 h-8 text-xs"
    };

    const baseClasses = `rounded-full flex items-center justify-center font-bold ring-2 ring-white bg-slate-200 text-slate-600 dark:ring-slate-900 dark:bg-slate-700 dark:text-slate-300 overflow-hidden shrink-0`;

    return (
        <div
            className={`${baseClasses} ${sizeClasses[size]} ${className}`}
            title={name}
        >
            {user?.image ? (
                <div className="relative w-full h-full">
                    <Image
                        src={user.image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            ) : (
                <span className="leading-none pt-[1px]">{initials}</span>
            )}
        </div>
    );
}
