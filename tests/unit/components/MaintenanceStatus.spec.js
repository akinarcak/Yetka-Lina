import { shallowMount } from '@vue/test-utils'
import MaintenanceStatus from '@/components/MaintenanceStatus'
import request from '@/utils/request'

jest.mock('@/utils/request', () => ({
  get: jest.fn(),
  post: jest.fn()
}))

const status = {
  attention_required: true,
  fingerprint: 'release-2',
  guide_url: 'https://docs.example.test/maintenance',
  update: {
    available: true,
    can_apply: true,
    current_version: '1.0.0',
    latest_version: '1.0.1',
    command: 'yetka-update 1.0.1'
  }
}

function mountComponent() {
  return shallowMount(MaintenanceStatus, {
    mocks: {
      $confirm: jest.fn().mockResolvedValue(true),
      $message: { success: jest.fn() }
    },
    stubs: ['el-button', 'el-dialog']
  })
}

describe('MaintenanceStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    request.get.mockResolvedValue(status)
    request.post.mockResolvedValue({ detail: 'queued' })
  })

  it('shows the native update control for an applicable update', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()

    expect(wrapper.vm.dialogVisible).toBe(true)
    expect(wrapper.vm.canApply).toBe(true)
    expect(wrapper.text()).toContain('Yeni Yetka sürümü hazır')
  })

  it('posts only the version returned by the maintenance API', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()
    await wrapper.vm.applyUpdate()

    expect(request.post).toHaveBeenCalledWith('/api/v1/maintenance/status/', {
      version: '1.0.1'
    })
  })
})
