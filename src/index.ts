import { defineNuxtModule } from '@nuxt/kit'
import type {
  ResolvedConfig,
  ViteDevServer,
} from 'vite'
import {
  build,
  startup,
} from 'vite-plugin-electron'
import { compare } from 'compare-versions'

// Fix tsc build error
import { NuxtModule, Nuxt } from '@nuxt/schema'
import { AddressInfo } from 'net'

export interface ElectronOptions {
  /**
   * `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
   * 
   * @example
   * 
   * ```js
   * export default defineNuxtConfig({
   *   modules: ['nuxt-electron-next'],
   *   electron: {
   *     build: [
   *       {
   *         // Main-Process entry file of the Electron App.
   *         entry: 'electron/main.ts',
   *       },
   *     ],
   *   },
   * })
   * ```
   */
  build: import('vite-plugin-electron').ElectronOptions[],
  /**
   * @see https://github.com/electron-vite/vite-plugin-electron-renderer
   */
  renderer?: Parameters<typeof import('vite-plugin-electron-renderer').default>[0]
  /**
   * nuxt-electron will modify some options by default
   * 
   * @defaultValue
   * 
   * ```js
   * export default defineNuxtConfig({
   *   ssr: false,
   *   app: {
   *     baseURL: './',
   *     buildAssetsDir: '/',
   *   },
   *   runtimeConfig: {
   *     app: {
   *       baseURL: './',
   *       buildAssetsDir: '/',
   *     },
   *   },
   *   nitro: {
   *     runtimeConfig: {
   *       app: {
   *         baseURL: './,
   *       }
  *      }
   *   },
   * })
   * ```
   */
  disableDefaultOptions?: boolean
}

let options: ElectronOptions
let nuxt: Nuxt
let viteConfigResolve: (config: ResolvedConfig) => void
const viteConfigPromise = new Promise<ResolvedConfig>(resolve => viteConfigResolve = resolve)
let viteServerResolve: (server: ViteDevServer) => void
const viteServerPromise = new Promise<ViteDevServer>(resolve => viteServerResolve = resolve)

export default defineNuxtModule<ElectronOptions>({
  meta: {
    name: 'nuxt-electron-next',
    configKey: 'electron',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  hooks: {
    async 'vite:extendConfig'(viteInlineConfig) {
      viteInlineConfig.plugins ??= []
      viteInlineConfig.plugins.push({
        name: 'get-vite-config',
        configResolved(config) {
          viteConfigResolve(config)
        },
      })

      if (options.renderer) {
        viteInlineConfig.plugins.push((await import('vite-plugin-electron-renderer')).default(options.renderer))
      }
    },
    'vite:serverCreated'(server) {
      viteServerResolve(server)
    },
    // For development
    listen(server) {
      // For `viteConfig.promise` can able resolved
      (async function _listen() {
        const addressInfo = server.address() as AddressInfo        
        Object.assign(process.env, {
          // This is required, and it is used in Electron-Main.
          VITE_DEV_SERVER_URL: `http://localhost:${addressInfo.port}`,
        })

        // https://github.com/electron-vite/vite-plugin-electron/blob/v0.11.2/src/index.ts#L37-L59
        for (const config of options.build) {
          config.vite ??= {}
          config.vite.mode ??= (await viteConfigPromise).mode
          config.vite.build ??= {}
          config.vite.build.watch ??= {}
          config.vite.build.minify ??= false
          config.vite.plugins ??= []
          config.vite.plugins.push({
            name: 'nuxt-electron-next:startup',
            closeBundle() {
              if (config.onstart) {
                config.onstart.call(this, {
                  startup,
                  reload() {
                    viteServerPromise.then(server => (server.hot || server.ws).send({ type: 'full-reload' }))
                  },
                })
              } else {
                startup()
              }
            },
          })
          build(config)
        }
      }())
    },
    // For build
    async 'build:done'() {
      if (!nuxt.options.dev) {
        // https://github.com/electron-vite/vite-plugin-electron/blob/v0.11.2/src/index.ts#L72-L76
        for (const config of options.build) {
          config.vite ??= {}
          config.vite.mode ??= (await viteConfigPromise).mode
          await build(config)
        }
      }
    },
    'build:manifest'(manifest) {
      for (const key in manifest) {
        // or other logic
        manifest[key].dynamicImports = []
      }
    },
  },
  async setup(_options, _nuxt) {
    options = _options
    nuxt = _nuxt

    adaptElectronConfig(options, nuxt)
  }
})

/** Opinionated config for Electron */
function adaptElectronConfig(options: ElectronOptions, nuxt: Nuxt) {
  if (!options.disableDefaultOptions) {
    // A Desktop App should be SPA
    nuxt.options.ssr = false // true

    // Fix path to make it works with Electron protocol `file://`
    nuxt.options.app.baseURL = './' // '/'
    if(compare(nuxt._version, '3.16.2', '<'))
      nuxt.options.app.buildAssetsDir = "/"; // '/_nuxt/' - #16

    nuxt.options.runtimeConfig.app.baseURL = './' // '/'
    if(compare(nuxt._version, '3.16.2', '<'))
      nuxt.options.runtimeConfig.app.buildAssetsDir = '/' // '/_nuxt/'
    nuxt.options.router.options.hashMode = true // Avoid 404 errors

    // Only apply on build
    if (!nuxt.options.dev) {
      nuxt.options.nitro.runtimeConfig ??= {}
      nuxt.options.nitro.runtimeConfig.app ??= {}
      nuxt.options.nitro.runtimeConfig.app.baseURL = './'
    }

  }
}
