import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  {
    rules: {
      // Common hydration/localStorage patterns; fix incrementally
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
