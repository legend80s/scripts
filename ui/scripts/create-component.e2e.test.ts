import { it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

it('should create components actually!', () => {
  const name = `Triangle${Date.now()}FooBarTempFileForTest`
  expect(() => {
    execSync(`npm run new ${name} -- --category=dataDisplay --title=三角形 --dev=false`)
  }).not.toThrow()

  // expect src/index.ts to have new component `export { default as TriangleFooBar } from './TriangleFooBar'`
  const index = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf-8')
  expect(index).toMatch(`export { default as ${name} } from './${name}'`)

  // expect new folders to be created as follows:
  // TriangleFooBar
  // ├── demo
  // │   ├── basic.test.tsx
  // │   ├── basic.tsx
  // │   ├── advanced.test.tsx
  // │   └── advanced.tsx
  // ├── index.less
  // ├── index.md
  // └── index.tsx
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/demo`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/demo/basic.test.tsx`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/demo/basic.tsx`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/demo/advanced.test.tsx`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/demo/advanced.tsx`))).toBe(true)

  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/index.less`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/index.md`))).toBe(true)
  expect(fs.existsSync(path.resolve(__dirname, `../src/${name}/index.tsx`))).toBe(true)

  // expect index.md has correct content
  // group: 📈 数据展示
  // title: TriangleFooBar 三角形
  const md = fs.readFileSync(path.resolve(__dirname, `../src/${name}/index.md`), 'utf-8')
  expect(md).toContain(`group: 📈 数据展示`)
  expect(md).toContain(`title: ${name} 三角形`)
  expect(md).toContain(`# ${name} 三角形 `)

  // after(() => {
  fs.rmSync(path.resolve(__dirname, `../src/${name}`), { recursive: true })
  fs.writeFileSync(
    path.resolve(__dirname, `../src/index.ts`),
    index.replace(`export { default as ${name} } from './${name}'\n`, ''),
  )
  // })
})
