const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    {
        rules: {
            // CJS config memerlukan require(), maka rule ini dimatikan
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn"
        }
    }
);
