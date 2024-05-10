/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import muiPlugin from '@miniprogram/mui'

import { basePreset, elementPlusPreset, miniprogramBasePreset } from 'tailwind-extensions'
import { isMp, isQuickapp } from '@uni-helper/uni-env'

const presets: Config['presets'] = [basePreset]
if (isMp || isQuickapp) {
  presets.push(
    elementPlusPreset({
      baseSelectors: [':root', 'page'],
    }),
    miniprogramBasePreset,
  )
}
else {
  presets.push(elementPlusPreset())
}

const theme: Config['theme'] = {}
if (isMp || isQuickapp)
  theme.screens = {}

const config: Config = {
  content: [
    'src/**/*.{vue,ts}',
    'src/main.ts',
    'src/App.vue',
    './index.html',
  ],
  corePlugins: {
    preflight: false,
    space: false,
    divideWidth: false,
  },
  divideColor: false,
  divideStyle: false,
  divideOpacity: false,
  presets,
  theme,
  plugins: [
    plugin(muiPlugin)
  ],
}

export default config
