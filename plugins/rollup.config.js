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
      format: 'es',
      dir: 'build',
      entryFileNames: '[name].js',
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      plugins: [],
    }),
    json(),
    typescript({
      check: false,
      tsconfig: './tsconfig.json',
    }),
  ],
  external: ['vite', 'chokidar', 'glob', 'hasha', 'ali-oss', 'miniprogram-ci'],
}
