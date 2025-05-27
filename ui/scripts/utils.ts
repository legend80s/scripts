import { spawn } from 'node:child_process'

export function chooseOpenCmd(): string {
  // 根据不同平台打开浏览器
  const openCommand =
    process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open'

  return openCommand
}

type IExecuteParams = {
  cmd: string
  cmdArgs?: string[]
  onOutput: (output: string) => void
}

export function execute({ cmd, cmdArgs = [], onOutput }: IExecuteParams) {
  const devCmd = cmd + ' ' + cmdArgs.join(' ')

  console.log('execSync: `' + devCmd + '`')

  // const stdio = execSync(devCmd, { stdio: 'inherit' }).toString('utf8')
  // 启动 npm run dev 并捕获输出
  const child = spawn(cmd, cmdArgs, {
    stdio: 'pipe',
    // 显式启用 shell，否则 Error: spawn npm ENOENT
    shell: true,
    env: {
      ...process.env,
      // 强制启用 真彩色（TrueColor） 或 16 万色（24-bit RGB）支持。
      // 否则没有颜色
      FORCE_COLOR: '3',
    },
  })
  // 手动将子进程的 stdout/stderr 转发到父进程
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  child.stdout.on('data', (data) => {
    const output = data.toString()

    onOutput(output)

    // console.log('[output]:', output)
  })
}
