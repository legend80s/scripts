import fs from 'node:fs'
import { parseArgs } from 'node:util'
import { execSync } from 'node:child_process'

import chalk from 'chalk'

import { chooseOpenCmd, execute } from './utils.ts'

const DEFAULT_TEMPLATE = 'JSONInput'

const LOG_LABEL = '[create-component]'

const log = (...args: any[]) => {
  console.log(LOG_LABEL, ...args)
}

const logError = (...args: any[]) => {
  console.error('\n' + chalk.red(LOG_LABEL, ...args))
}

const config = {
  category: {
    layout: '🧩 布局',
    login: '🔐 登录',
    feedback: '🔊 反馈',
    dataEntry: '📝 数据录入',
    dataDisplay: '📈 数据展示',
    ai: '🧙‍♂️ AI',
    hooks: '🎣 hooks',
  },
}

const options = {
  help: {
    type: 'boolean',
    short: 'h',
    description: 'Show this help message',
    required: '×',
    default: false,
  },

  category: {
    type: 'string',
    short: 'c',
    description: `组件分类，可选值：${Object.keys(config.category).join(' | ')}`,
    required: '✅',
    default: '数据展示',
  },

  title: {
    type: 'string',
    short: 't',
    description: '简单描述组件功能',
    required: '✅',
    default: 'TODO:请填充组件中文标题',
  },

  dev: {
    // 不能是 boolean 否则无法设置 false
    type: 'string',
    description: '组件生成后是否自动运行 devServer 并且打开浏览器',
    required: '×',
    default: 'true',
  },

  template: {
    type: 'string',
    description: '复制哪一个已存在的组件模板',
    required: '×',
    default: DEFAULT_TEMPLATE,
  },

  debug: {
    type: 'boolean',
    default: false,
    description: 'Print debug info',
    required: '×',
    short: 'd',
  },

  dryRun: {
    type: 'boolean',
    default: false,
    description: 'Not write files only print what would be done',
    required: '×',
  },
} as const satisfies Record<string, IOptionDefinition>

// type ToOptions<T extends Record<string, IOptionDefinition>> = {
//   [K in keyof T]: T[K]['type'] extends 'string' ? string : boolean
// }

// type IOptions = ToOptions<typeof options>

main()

function main() {
  // @ts-expect-error
  if (!fs.globSync) {
    console.error('[ERR] 请切换到 Node 22+ 版本')
    process.exitCode = 1
    return
  }

  const allArgs = process.argv.slice(2)

  // console.log('allArgs', allArgs)

  const [componentName, ...args] = allArgs
  const { values: parsed } = parseArgs({ args, options, allowPositionals: true })

  const { help, dev, ...opts } = parsed

  if (opts.debug) {
    log('[debug] args:', allArgs)
    log('[debug] parsed:', parsed)

    // return
  }

  if (help) {
    printHelp()

    return
  }
  try {
    // @ts-expect-error
    create({ name: componentName, ...opts })

    const shouldStartDevServer = dev !== 'false'

    if (shouldStartDevServer) {
      startDevServer({ componentName, dryRun: !!opts.dryRun })
    } else {
      log('\nYou can start dev server now:')
      log(`\n$ npm run dev\n`)
    }
  } catch (error) {
    console.error(error)

    // 删除文件是危险操作，先注释掉
    // fs.rmdirSync(`./src/${componentName}`, { recursive: true, force: true })

    process.exitCode = 1
  }
}

function startDevServer({ dryRun, componentName }: { dryRun: boolean; componentName: string }) {
  let url: string | undefined
  let opened = false

  const devCmd = `npm run dev`
  const open = chooseOpenCmd()
  const hyphenatedComponentName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  let openInBrowserCmd = `${open} http://localhost:xxxx/components/${hyphenatedComponentName}`

  log('execSync: `' + devCmd + '`')

  if (dryRun) {
    log('execSync:', openInBrowserCmd)
    return
  }

  const watchConfig = {
    'http://localhost': (output: string) => {
      // match url from output `        ║  >   Local: http://localhost:8001                  ║`
      url = output.match(/(http:\/\/localhost:\d+)/)?.[1]

      // 防止输出打断 npm run dev 日志
      setTimeout(() => {
        console.log()
        log(
          chalk.green(
            '本地服务器已启动，正在等待编译完成，编译完成将自动打开该组件对应的浏览器地址...',
          ),
          '\n',
        )
      }, 200)
    },

    '[Webpack] Compiled in ': () => {
      if (!url) {
        throw new Error('无法获取本地服务器地址')
      }

      // 防止 hot reload 二次编译重复打开浏览器
      if (opened) {
        return
      }

      opened = true

      // 这里没有考虑非 Windows 系统。如果需要则使用 open npm 包
      openInBrowserCmd = `${open} ${url}/components/${hyphenatedComponentName}`
      console.log()
      log(chalk.green('检测到编译完成，打开浏览器', openInBrowserCmd))

      if (dryRun) {
        log('execSync:', openInBrowserCmd)
        return
      }

      execSync(openInBrowserCmd, { stdio: 'inherit' })
    },
  }

  execute({
    cmd: `npm`,
    cmdArgs: ['run', 'dev'],
    onOutput: (output) => {
      for (const [key, callback] of Object.entries(watchConfig)) {
        if (output.includes(key)) {
          callback(output)
        }
      }
    },
  })
}

function printHelp() {
  console.log('Usage: npm run new <ComponentName> [options]')
  console.log(
    `Example:\nnpm run new LongText -- --category=${config.category.dataDisplay} --title=长文本展示 --template=${DEFAULT_TEMPLATE}`,
  )

  console.log()
  console.log('Options:')
  console.table(options)
}

type ICreateOptions = {
  name: string
  category?: string
  title: string

  template?: string
  debug?: boolean
  dryRun?: boolean
}

/**
 *
 * @param opts
 */
function create({
  name,
  category,
  title,
  template = DEFAULT_TEMPLATE,
  dryRun = false,
  // debug = false,
}: ICreateOptions) {
  if (!name) {
    throw new Error('Please provide a component name')
  }

  if (!category || !config.category[category]) {
    logError(`Invalid category, please choose from the following:`)
    console.log(Object.keys(config.category))
    throw new Error('Invalid category')
  }

  const componentPath = `src/${name}`

  if (fs.existsSync(componentPath)) {
    throw new Error('Component already exists')
  }

  const templatePath = `src/${template}`

  const allowedTemplates = fs.readdirSync('src').filter((name) => /[A-Z]/.test(name[0]))

  if (!allowedTemplates.includes(template)) {
    console.error('Allowed templates:', allowedTemplates)
    throw new Error(`Template "${template}" does not exist`)
  }

  const label = chalk.green(
    `${LOG_LABEL} Create component "${chalk.bold(name)}" from template "${template}" success`,
  )
  console.time(label)

  if (dryRun) {
    console.timeEnd(label)

    return
  }

  fs.mkdirSync(componentPath)

  fs.cpSync(templatePath, componentPath, { recursive: true })

  // entries: [
  //   'src\\ResultModal\\index.md',
  //   'src\\ResultModal\\index.tsx',
  //   'src\\ResultModal\\demo\\basic.test.tsx',
  //   'src\\ResultModal\\demo\\basic.tsx',
  //   'src\\ResultModal\\demo\\middle.tsx'
  // ]
  // @ts-expect-error
  const entries = fs.globSync(componentPath + '/**/*.*')

  for (const entry of entries) {
    const oldContent = fs.readFileSync(entry, 'utf-8')
    const newContent = oldContent.replace(new RegExp(template, 'g'), name)

    fs.writeFileSync(entry, newContent, 'utf-8')
  }

  const md = `src/${name}/index.md`
  const oldContent = fs.readFileSync(md, 'utf-8')

  // @ts-expect-error
  const nameAndTitle = oldContent.match(/title: ([^\r\n]+)/)[1]

  // console.log('old nameAndTitle', nameAndTitle.length, `|${nameAndTitle}|`)
  // console.log('new nameAndTitle', `|${name} ${title}|`)

  const newContent = oldContent
    .replace(new RegExp(`group: [^\n]+`), `group: ${config.category[category]}`)
    .replaceAll(nameAndTitle, `${name} ${title}`)

  // console.log('oldContent:', oldContent.slice(0, 150))
  // console.log('newContent:', newContent.slice(0, 150))
  fs.writeFileSync(md, newContent, 'utf-8')

  if (!fs.readFileSync('src/index.ts', 'utf-8').includes(` ${name} `)) {
    fs.appendFileSync('src/index.ts', `export { default as ${name} } from './${name}'\n`)
  }

  console.timeEnd(label)
}

type IOptionDefinition =
  | {
      type: 'string'
      short?: string
      description?: string
      required: '×' | '✅'
      default: string
    }
  | {
      type: 'boolean'
      short?: string
      description?: string
      required: '×' | '✅'
      default: boolean
    }
