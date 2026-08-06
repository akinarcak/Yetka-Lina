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
    can_plan: true,
    current_version: '1.0.0',
    latest_version: '1.0.1',
    command: 'yetka-update 1.0.1'
  }
}

const planQueued = { ...status, pending_action: 'plan' }
const planFinished = {
  ...status,
  pending_action: null,
  last_result: {
    action: 'plan',
    version: '1.0.1',
    finished_at: '2026-08-06T18:02:00Z',
    exit_code: 0,
    succeeded: true,
    truncated: false,
    output: 'Plan complete; no host changes were made'
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

  it('asks for a plan without asking to apply anything', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()
    await wrapper.vm.planUpdate()

    expect(request.post).toHaveBeenCalledWith('/api/v1/maintenance/status/', {
      version: '1.0.1',
      action: 'plan'
    })
    // Planning changes nothing, so it must not go through the apply warning.
    expect(wrapper.vm.$confirm).not.toHaveBeenCalled()
    wrapper.vm.stopPolling()
  })

  it('reports a plan as running while the host still has it queued', async () => {
    request.get.mockResolvedValue(planQueued)
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()

    expect(wrapper.vm.planRunning).toBe(true)
  })

  it('shows the finished plan output and its outcome', async () => {
    request.get.mockResolvedValue(planFinished)
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()

    expect(wrapper.vm.planRunning).toBe(false)
    expect(wrapper.vm.lastResultTitle).toBe('Plan başarılı — 1.0.1')
    expect(wrapper.text()).toContain('no host changes were made')
  })

  it('marks a failed run and keeps its exit code visible', async () => {
    request.get.mockResolvedValue({
      ...planFinished,
      last_result: { ...planFinished.last_result, succeeded: false, exit_code: 4 }
    })
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()

    expect(wrapper.vm.lastResultTitle).toBe('Plan başarısız (çıkış kodu 4) — 1.0.1')
  })

  it('does not reopen the dialog underneath an operator reading a result', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.loadStatus()
    wrapper.vm.dismiss()
    expect(wrapper.vm.dialogVisible).toBe(false)

    await wrapper.vm.loadStatus()
    expect(wrapper.vm.dialogVisible).toBe(false)
  })
})
