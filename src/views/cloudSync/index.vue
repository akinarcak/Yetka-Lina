<template>
  <div class="cloud-sync-page">
    <el-alert
      v-if="tenantError"
      :title="tenantError"
      type="warning"
      show-icon
      :closable="false"
      class="tenant-alert"
    />
    <el-card shadow="never">
      <div slot="header" class="page-header">
        <div>
          <h2>Cloud Sync</h2>
          <p>AWS and Azure inventory is imported asynchronously into the current customer workspace.</p>
        </div>
        <div class="header-actions">
          <el-tag v-if="currentTenant" type="info">{{ currentTenant.name }} · {{ currentTenant.role }}</el-tag>
          <el-button icon="el-icon-refresh" :loading="loading" @click="loadAll">Refresh</el-button>
          <el-button
            v-if="$hasPerm('cloud_sync.add_cloudsyncaccount')"
            type="primary"
            :disabled="!currentTenant"
            @click="dialogVisible = true"
          >Add account</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-click="loadTab">
        <el-tab-pane label="Accounts" name="accounts">
          <el-table v-loading="loading" :data="accounts">
            <el-table-column prop="name" label="Name" min-width="180" />
            <el-table-column label="Provider" width="130">
              <template slot-scope="scope">{{ valueOf(scope.row.provider).toUpperCase() }}</template>
            </el-table-column>
            <el-table-column prop="regions" label="Regions" min-width="180">
              <template slot-scope="scope">{{ (scope.row.regions || []).join(', ') || 'All' }}</template>
            </el-table-column>
            <el-table-column prop="date_last_sync" label="Last sync" min-width="180">
              <template slot-scope="scope">{{ scope.row.date_last_sync || 'Never' }}</template>
            </el-table-column>
            <el-table-column label="Status" width="100">
              <template slot-scope="scope"><el-tag :type="scope.row.is_active ? 'success' : 'info'">{{ scope.row.is_active ? 'Active' : 'Inactive' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="Actions" width="230" fixed="right">
              <template slot-scope="scope">
                <el-button v-if="$hasPerm('cloud_sync.change_cloudsyncaccount')" size="mini" :loading="syncing === scope.row.id" @click="sync(scope.row)">Sync</el-button>
                <el-button v-if="$hasPerm('cloud_sync.change_cloudsyncaccount')" size="mini" @click="testConnection(scope.row)">Test</el-button>
                <el-button v-if="$hasPerm('cloud_sync.delete_cloudsyncaccount')" size="mini" type="danger" @click="remove(scope.row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Executions" name="executions">
          <el-table v-loading="loading" :data="executions">
            <el-table-column prop="date_created" label="Queued" min-width="180" />
            <el-table-column prop="status" label="Status" width="120"><template slot-scope="scope"><el-tag>{{ valueOf(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column prop="total" label="Total" width="90" />
            <el-table-column prop="created" label="Created" width="90" />
            <el-table-column prop="updated" label="Updated" width="90" />
            <el-table-column prop="failed" label="Failed" width="90" />
            <el-table-column prop="error" label="Error" min-width="220" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Quarantine" name="quarantine">
          <el-table v-loading="loading" :data="quarantine">
            <el-table-column prop="provider_object_id" label="Provider object" min-width="180" />
            <el-table-column prop="reason_code" label="Reason" width="180" />
            <el-table-column prop="reason_detail" label="Detail" min-width="240" show-overflow-tooltip />
            <el-table-column label="Observed" min-width="260"><template slot-scope="scope"><code>{{ scope.row.observed }}</code></template></el-table-column>
            <el-table-column prop="date_updated" label="Updated" min-width="180" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <AccountDialog :visible="dialogVisible" @close="dialogVisible = false" @saved="loadAccounts" />
  </div>
</template>

<script>
import request from '@/utils/request'
import AccountDialog from './AccountDialog.vue'
import { rememberTenantMappings, getTenantForOrganization } from '@/utils/yetkaTenant'

function rows(response) {
  return response?.results || response || []
}

export default {
  name: 'YetkaCloudSync',
  components: { AccountDialog },
  data() {
    return {
      activeTab: 'accounts', loading: false, syncing: '', dialogVisible: false,
      tenants: [], accounts: [], executions: [], quarantine: [], tenantError: ''
    }
  },
  computed: {
    currentTenant() {
      const orgId = this.$store.getters.currentOrg?.id
      const tenantId = getTenantForOrganization(orgId)
      return this.tenants.find(item => item.id === tenantId)
    }
  },
  async mounted() {
    await this.loadTenants()
    await this.loadAll()
  },
  methods: {
    valueOf(value) {
      return value?.value || value || ''
    },
    async loadTenants() {
      this.tenants = rows(await request.get('/api/v1/tenants/'))
      rememberTenantMappings(this.tenants)
      const orgId = this.$store.getters.currentOrg?.id
      this.tenantError = getTenantForOrganization(orgId)
        ? ''
        : 'The current workspace is not assigned to an active customer tenant. Cloud Sync is unavailable.'
    },
    async loadAll() {
      if (!this.currentTenant) return
      this.loading = true
      try {
        await Promise.all([this.loadAccounts(), this.loadExecutions(), this.loadQuarantine()])
      } finally {
        this.loading = false
      }
    },
    loadTab() {
      const loaders = { accounts: this.loadAccounts, executions: this.loadExecutions, quarantine: this.loadQuarantine }
      return loaders[this.activeTab]()
    },
    async loadAccounts() {
      this.accounts = rows(await request.get('/api/v1/cloud-sync/accounts/'))
    },
    async loadExecutions() {
      this.executions = rows(await request.get('/api/v1/cloud-sync/executions/'))
    },
    async loadQuarantine() {
      // The current backend exposes accounts and executions. Quarantine
      // records are not yet a public endpoint, so keep this tab empty rather
      // than issuing a request that produces a distracting 404 toast.
      this.quarantine = []
    },
    async sync(account) {
      this.syncing = account.id
      try {
        const key = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
        await request.post(`/api/v1/cloud-sync/accounts/${account.id}/sync/`, {}, {
          headers: { 'Idempotency-Key': key }
        })
        this.$message.success('Cloud sync queued')
        this.activeTab = 'executions'
        await this.loadExecutions()
      } finally {
        this.syncing = ''
      }
    },
    async testConnection(account) {
      const result = await request.post(`/api/v1/cloud-sync/accounts/${account.id}/test/`)
      if (result.ok) this.$message.success('Connection succeeded')
    },
    async remove(account) {
      await this.$confirm(`Delete cloud sync account “${account.name}”?`, 'Confirm', { type: 'warning' })
      await request.delete(`/api/v1/cloud-sync/accounts/${account.id}/`)
      this.$message.success('Cloud sync account deleted')
      await this.loadAccounts()
    }
  }
}
</script>

<style lang="scss" scoped>
.cloud-sync-page { padding: 20px; }
.tenant-alert { margin-bottom: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.page-header h2 { margin: 0 0 4px; }
.page-header p { margin: 0; color: #8492a6; }
.header-actions { display: flex; align-items: center; gap: 8px; }
code { white-space: normal; word-break: break-word; }
</style>
