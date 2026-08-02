import fs from 'fs'
import path from 'path'

describe('Page unavailable rendering', () => {
  test('does not regress to an overlay mask', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/layout/components/Page/index.vue'),
      'utf8'
    )
    expect(source).not.toContain('content-disabled-mask')
    expect(source).not.toContain('backdrop-filter: blur')
    expect(source).toContain('<slot v-if="!disabled" />')
  })
})
