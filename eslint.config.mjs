import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "node_modules/**"],
    rules: {
      // This lesson intentionally hydrates localStorage state on mount.
      "react-hooks/set-state-in-effect": "off",
      // Timing reads occur inside the user-triggered async request handler, not render.
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
