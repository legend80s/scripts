import { execSync } from 'node:child_process'
import { it, expect } from 'vitest'
import { chooseOpenCmd } from './utils'

it('works --dryRun', () => {
  const stdio = execSync(
    `npm run new FooBar -- --category=dataDisplay --title=三角形 --dryRun --debug`,
  ).toString('utf-8')
  // console.log('stdio:', stdio)

  const list = stdio
    .split('\n')
    .map((str) => str.trim())
    .filter(Boolean)

  expect(list.at(-3)).toMatch(
    /Create component "FooBar" from template "JSONInput" success: \d+\.\d+ms/,
  )
  expect(list.slice(-2)).toEqual([
    '[create-component] execSync: `npm run dev`',
    `[create-component] execSync: ${chooseOpenCmd()} http://localhost:xxxx/components/foo-bar`,
  ])
})

it('should throw error when category is invalid', () => {
  expect(() =>
    execSync(`npm run new FooBar -- --category=数据展示 --title='三角形' --dryRun`).toString(
      'utf-8',
    ),
  ).toThrow(/Invalid category/)
})
