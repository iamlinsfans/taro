import { recursiveMerge } from '@tarojs/helper'
import { Combination } from './Combination'
import { H5BaseConfig } from './H5BaseConfig'
import { WebpackPlugin } from './WebpackPlugin'
import { H5WebpackPlugin } from './H5WebpackPlugin'
import { H5WebpackModule } from './H5WebpackModule'
import { addLeadingSlash, addTrailingSlash } from '../utils'

import type { H5BuildConfig } from '../utils/types'

export class H5Combination extends Combination<H5BuildConfig> {
  enableSourceMap: boolean
  defaultTerserOptions: {
    keep_fnames: true,
    output: {
      comments: false,
      keep_quoted_props: true,
      quote_keys: true,
      beautify: false
    },
    warnings: false
  }

  process (config: Partial<H5BuildConfig>) {
    const baseConfig = new H5BaseConfig(this.appPath, config)
    const chain = this.chain = baseConfig.chain
    const {
      entry = {},
      output = {},
      mode = 'production',
      enableSourceMap = process.env.NODE_ENV !== 'production',
      sourceMapType = 'eval-cheap-module-source-map',
      publicPath = '/',
      chunkDirectory = 'chunk',
      alias = {}
    } = config

    this.enableSourceMap = enableSourceMap

    const webpackOutput = this.getOutput({
      mode,
      publicPath,
      chunkDirectory,
      customOutput: output
    })
    const webpackPlugin = new H5WebpackPlugin(this)
    const webpackModule = new H5WebpackModule(this)

    chain.merge({
      entry,
      output: webpackOutput,
      mode,
      devtool: this.getDevtool(enableSourceMap, sourceMapType),
      resolve: { alias },
      plugin: webpackPlugin.getPlugins(),
      module: webpackModule.getModules(),
      optimization: this.getOptimization(mode)
    })
  }

  getOutput ({ mode, publicPath, chunkDirectory, customOutput }) {
    publicPath = addTrailingSlash(publicPath)
    if (mode === 'development') {
      publicPath = addLeadingSlash(publicPath)
    }
    return {
      path: this.outputDir,
      filename: 'js/[name].js',
      chunkFilename: `${chunkDirectory}/[name].js`,
      publicPath,
      ...customOutput
    }
  }

  getOptimization (mode: string) {
    const { terser } = this.config
    const minimizer: Record<string, any> = {}
    const isTerserEnabled = !(terser?.enable === false)

    if (mode === 'production' && isTerserEnabled) {
      const terserOptions = recursiveMerge({}, this.defaultTerserOptions, terser?.config || {})
      minimizer.terserPlugin = WebpackPlugin.getTerserPlugin(terserOptions)
    }

    return {
      minimizer
    }
  }
}