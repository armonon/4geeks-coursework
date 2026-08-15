import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Uses FlatCompat rather than importing eslint-config-next's flat entry
// points directly. Those extensionless ESM imports
// ("eslint-config-next/core-web-vitals") are a Next 16 packaging detail;
// on Next 15 they do not resolve. This matches uis/backoffice, so both
// apps now configure eslint the same way.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
