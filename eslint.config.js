import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from 'eslint-plugin-vue'

/**
 * @type { import("eslint").Linter.Config[]}
 */
export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    ignores: [
      "**/dist/**/*.js",
      "**/dist/**/*.ts",
      "**/build/**/*.js",
      "**/build/**/*.ts",
      "**/node_modules/**/*.js",
      "**/node_modules/**/*.ts"
    ],
    rules: {
      semi: ["error", "never"],
      "vue/multi-word-component-names": "off",
      "no-undef": "off",
    },
  }
]