<p align="center">
  <img width="170" src="https://github.com/OlaAlsaker/nuxt-electron-next/raw/main/logo.svg?raw=true">
</p>

# Nuxt Electron (Next)

Integrate Nuxt 4 and Electron

> [!NOTE]
> **This is a fork of [nuxt-electron](https://github.com/caoxiemeihao/nuxt-electron) that is updated to work with Nuxt 4.**

## Features

- 📦 Out of the box
- 🔥 Hot restart <sub><sup>(Main process)</sup></sub>
- 🚀 Hot reload <sub><sup>(Preload script)</sup></sub>

## Quick Setup


1. Install the package and the following dependencies to your project

```sh
# Using pnpm
pnpm add -D nuxt-electron-next vite-plugin-electron vite-plugin-electron-renderer electron electron-builder

# Using yarn
yarn add --dev nuxt-electron-next vite-plugin-electron vite-plugin-electron-renderer electron electron-builder

# Using npm
npm install --save-dev nuxt-electron-next vite-plugin-electron vite-plugin-electron-renderer electron electron-builder
```

2. Update your `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-electron-next'],
  electron: {
    build: [
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
    ],
  },
  ssr: false,
  ...
})
```

3. Create the `electron/main.ts` file and type the following code

```ts
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  new BrowserWindow().loadURL(process.env.VITE_DEV_SERVER_URL)
})
```

4. Add the `main` entry to `package.json`

```diff
{
+ "main": "dist-electron/main.js"
}
```

That's it! You can now use Electron in your Nuxt app ✨

## Electron Options

> This is based on the `vite-plugin-electron`, see the **[Documents](https://github.com/electron-vite/vite-plugin-electron)** for more detailed options

```ts
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
      router: {
        options: {
          hashMode: true,
        }
      }
   * })
   * ```
   */
  disableDefaultOptions?: boolean
}
```

## Recommend Structure

```diff
+ ├─┬ electron
+ │ └── main.ts
  ├─┬ public
  │ └── favicon.ico
  ├── .gitignore
  ├── .npmrc
  ├── index.html
  ├── app.vue
  ├── nuxt.config.ts
  ├── package.json
  ├── README.md
  └── tsconfig.json
```

## Examples

- [quick-start](https://github.com/OlaAlsaker/nuxt-electron-next/tree/main/quick-start)

## Notes
By default, we force the App to run in SPA mode since we don't need SSR for desktop apps

If you want to fully customize the default behavior, you can disable it by `disableDefaultOptions`
