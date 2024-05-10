import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'

export default {
  input: {
    index: 'src/index.ts',
  },
  output: [
    {
      // format: 'commonjs',
      format: 'es',
      dir: 'build',
      entryFileNames: '[name].js',
    },
  ],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      plugins: [],
    }),
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    typescript({
      check: false,
      tsconfig: './tsconfig.json',
    }),
  ],
  external: ['vue'],
}
