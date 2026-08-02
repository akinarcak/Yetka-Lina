const STORAGE_KEY = 'yetka.tenantByOrganization'

function readMappings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch (error) {
    return {}
  }
}

export function getTenantForOrganization(organizationId) {
  return readMappings()[organizationId] || ''
}

export function rememberTenantMappings(tenants) {
  const mappings = {}
  for (const tenant of tenants || []) {
    for (const organizationId of tenant.organization_ids || []) {
      mappings[organizationId] = tenant.id
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
  return mappings
}

export function clearTenantMappings() {
  localStorage.removeItem(STORAGE_KEY)
}
