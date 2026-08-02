import {
  clearTenantMappings,
  getTenantForOrganization,
  rememberTenantMappings
} from '@/utils/yetkaTenant'

describe('Yetka customer tenant mapping', () => {
  beforeEach(() => localStorage.clear())

  it('maps only server-authorized tenant workspace relationships', () => {
    rememberTenantMappings([
      { id: 'tenant-a', organization_ids: ['org-a', 'org-b'] },
      { id: 'tenant-c', organization_ids: ['org-c'] }
    ])

    expect(getTenantForOrganization('org-a')).toBe('tenant-a')
    expect(getTenantForOrganization('org-c')).toBe('tenant-c')
    expect(getTenantForOrganization('org-unknown')).toBe('')
  })

  it('fails closed for corrupt state and can clear stale mappings', () => {
    localStorage.setItem('yetka.tenantByOrganization', '{invalid')
    expect(getTenantForOrganization('org-a')).toBe('')
    rememberTenantMappings([{ id: 'tenant-a', organization_ids: ['org-a'] }])
    clearTenantMappings()
    expect(getTenantForOrganization('org-a')).toBe('')
  })
})
