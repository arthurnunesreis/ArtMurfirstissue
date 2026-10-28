import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // CLAUDE.md principle 8: permission checks go through can() in src/lib/access only.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/access/**", "src/generated/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='Role'][property.name=/^(ADMIN|USER)$/]",
          message: "Check permissions with can()/decide() from @/lib/access, not Role values.",
        },
        {
          selector:
            "BinaryExpression[operator=/^[!=]==?$/] > MemberExpression.left[property.name='role']",
          message:
            "Check permissions with can()/decide() from @/lib/access, not .role comparisons.",
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
      "landing/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
