// tests\bunSvgPlugin.ts

import path from 'node:path'

import type { BunPlugin } from 'bun'
import { plugin } from 'bun'

const debugging = false
const log = (...args: unknown[]) => debugging && console.log(...args)
const debugTag = 'api-key'

/**
 * SyntaxError: Export named 'ReactComponent' not found in module 'D:\project\src\assets\reload.svg'.
 * https://github.com/oven-sh/bun/issues/3673
 */
const svgPlugin: BunPlugin = {
  name: 'SVG',
  async setup(build) {
    // 存储文件导入关系
    const importGraph = new Map<string, Set<string>>()

    const { readFileSync } = await import('fs')

    const SVG_REGEXP = /^(?!.*node_modules).*\.(svg)$/

    // 第一步：建立导入关系图
    build.onResolve({ filter: SVG_REGEXP }, (args) => {
      // log('args:', args)

      if (args.importer) {
        if (!importGraph.has(args.importer)) {
          importGraph.set(args.importer, new Set())
        }

        importGraph.get(args.importer)?.add(args.path)
      }

      return null
    })

    // 第二步：反向查找哪些文件导入了当前 SVG
    function checkIfReactComponentImport(svgPath: string): boolean {
      const hit = svgPath.includes(debugTag)
      hit && log(debugTag, 'svgPath:', svgPath, 'importGraph:', importGraph)
      // @ts-expect-error
      for (const [importer, importedFiles] of importGraph) {
        hit && log(debugTag, 'importedFiles:', importedFiles)

        if (
          Array.from(importedFiles).some((relativeSvgPath) =>
            // @ts-expect-error
            isPathEquivalent({ relativePath: relativeSvgPath, absolutePath: svgPath }),
          )
        ) {
          const code = readFileSync(importer, 'utf8')

          if (hasReactComponentImport(code, svgPath)) {
            return true // 找到至少一个需要转换的导入
          }
        }
      }

      return false
    }

    function hasReactComponentImport(code: string, svgPath: string) {
      // import { ReactComponent as SettingsIconGradient } from '../../../assets/settings-gradient.svg'
      const hit = svgPath.includes(debugTag)
      const debug = (...args) => hit && log(debugTag, ...args)

      // D:\\project\\src\\assets\\settings-gradient.svg
      // to assets\\settings-gradient.svg
      const relativeSvgPath = path.relative('src', svgPath)
      // components\api-key-bind-full-page\api-key.svg
      debug('[hasReactComponentImport] relative svgPath:', relativeSvgPath)

      const index = code.indexOf(debugTag)

      if (index !== -1) {
        debug('code[-90,+30]:', code.slice(index - 90, index + 30))
      }

      return code.split('\n').some((line) => {
        // line: import { ReactComponent as SettingsIconGradient } from '../../../assets/settings-gradient.svg'
        // line.includes('import') && log('line:', line)

        if (line.includes(`import { ReactComponent as `)) {
          if (line.includes(toUnixPath(relativeSvgPath))) {
            debug('line hit condition 1:', line)

            return true
          } else {
            // @ts-expect-error
            const importPath = line.split(' from ').at(-1).split("'").at(1) as string

            if (isPathEquivalent({ absolutePath: svgPath, relativePath: importPath })) {
              debug('line hit condition 2:', line)

              return true
            }

            debug('line miss:', line)
          }
        }
      })
    }

    build.onLoad({ filter: SVG_REGEXP }, (args) => {
      // log('importGraph:', importGraph)
      // 检查是否有文件通过 `{ ReactComponent }` 导入此 SVG
      const shouldTransform = checkIfReactComponentImport(args.path)

      if (!shouldTransform) {
        log('not:', args.path)

        return {
          contents: `export default ${JSON.stringify(args.path)}`,
          loader: 'js',
        }
      }

      log('yes:', args.path)

      const relativeSvgPath = toUnixPath(path.relative('src', args.path))

      return {
        contents: `export function ReactComponent() { return <svg aria-label="${relativeSvgPath}-simplified by bunSvgPlugin"></svg> }`,
        loader: 'js', // not sure why js and not jsx, but it works only this way
      }
    })
  },
}

main()

function main() {
  plugin(svgPlugin)
  fixFollowRedirectsFirstArgumentMustBeAnErrorObject()

  // const eq = isPathEquivalent({
  //   relativePath: './api-key.svg',
  //   absolutePath:
  //     'D:\\project\\src\\components\\api-key-bind-full-page\\api-key.svg',
  // })

  // console.log('eq:', eq)
}

function toUnixPath(path: string) {
  return path.replace(/\\/g, '/')
}

/**
 * 检查两个路径是否等价（忽略前置的 ../ 层级，只比较最终路径部分）
 * @param absolutePath 绝对路径（Windows格式）
 * @param relativePath 相对路径（Unix格式）
 * @returns 是否等价
 */
function isPathEquivalent({
  absolutePath,
  relativePath,
}: {
  absolutePath: string
  relativePath: string
}) {
  // absolutePath.includes('gradient') && console.log('absolutePath:', { absolutePath, relativePath })
  // 1. 标准化绝对路径（统一为Unix风格）
  const normalizedAbsolute = toUnixPath(absolutePath)

  // 2. 提取相对路径的非../部分（如 "../../../assets/foo.svg" → "assets/foo.svg"）
  const relativeSuffix = relativePath.replace(/^(\.{1,}\/)+/, '').replace(/^@/, '')

  // 3. 检查绝对路径是否以相对路径后缀结尾
  return normalizedAbsolute.endsWith(relativeSuffix)
}


// 测试用例
// const absolutePath = 'D:\\project\\src\\assets\\settings-gradient.svg';
// const relativePath = '../../../assets/settings-gradient.svg';

// console.log(isPathEquivalent(absolutePath, relativePath)); // true

/**  635 |       Error.captureStackTrace(this, this.constructor);
 *                   ^
 * TypeError: First argument must be an Error object
 *       at new CustomError (D:\project\node_modules\follow-redirects\index.js:635:13)
 *       at createErrorType (D:\project\node_modules\follow-redirects\index.js:643:27)
 *       at <anonymous> (D:\project\node_modules\follow-redirects\index.js:64:29)
 */
function fixFollowRedirectsFirstArgumentMustBeAnErrorObject() {
  const fs = require('node:fs')
  const followRedirectsPath = require.resolve('follow-redirects')

  // 备份原始模块
  const originalCode = fs.readFileSync(followRedirectsPath, 'utf8')

  // 修改模块内容
  const modifiedCode = originalCode.replace(
    /Error\.captureStackTrace\(this, this\.constructor\);/g,
    'Error.captureStackTrace(new Error(), this.constructor);',
  )

  // 临时覆写模块
  fs.writeFileSync(followRedirectsPath, modifiedCode)

  // 测试完成后恢复（需要监听进程退出）
  process.on('exit', () => {
    fs.writeFileSync(followRedirectsPath, originalCode)
  })
}
