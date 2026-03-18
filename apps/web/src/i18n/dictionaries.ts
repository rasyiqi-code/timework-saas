import idLocale from './locales/id.json';

export type Dictionary = typeof idLocale;

export const dictionaries = {
    id: () => Promise.resolve(idLocale as Dictionary),
    en: () => import('./locales/en.json').then((module) => (module.default || module) as Dictionary),
};
