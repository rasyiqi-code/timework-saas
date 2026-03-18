import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Time Work',
        short_name: 'Time Work',
        description: 'Enterprise Project & Protocol Management System',
        start_url: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        background_color: '#f8fafc',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
