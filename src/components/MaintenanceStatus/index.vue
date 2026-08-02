<template>
  <div>
    <div v-if="updateAvailable && canApply" class="yetka-update-control">
      <div>
        <strong>Yeni Yetka sürümü hazır</strong>
        <small>{{ update.current_version }} → {{ update.latest_version }}</small>
      </div>
      <el-button :loading="applying" size="small" type="success" @click="applyUpdate">Güncelle</el-button>
    </div>

    <el-dialog
      :visible.sync="dialogVisible"
      append-to-body
      title="Güvenlik ve güncelleme kontrolü"
      width="680px"
    >
      <p>Yetka yöneticisinin incelemesi gereken yeni bakım bulguları var.</p>
      <ul>
        <li v-for="finding in findings" :key="finding">{{ finding }}</li>
      </ul>
      <div v-if="update.command" class="update-command">
        <span>Sunucuda çalıştırılacak doğrulanmış komut:</span>
        <code>{{ update.command }}</code>
        <el-button size="mini" @click="copyCommand">Komutu kopyala</el-button>
      </div>
      <span slot="footer">
        <el-button v-if="status.guide_url" @click="openGuide">Bakım rehberi</el-button>
        <el-button v-if="canApply" :loading="applying" type="success" @click="applyUpdate">
          Güncellemeleri al
        </el-button>
        <el-button @click="dismiss">24 saat ertele</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

const API_URL = '/api/v1/maintenance/status/'
const DISMISS_KEY = 'yetka-maintenance-dismissed-v3'
const DISMISS_MS = 24 * 60 * 60 * 1000

export default {
  name: 'MaintenanceStatus',
  data() {
    return {
      status: {},
      dialogVisible: false,
      applying: false
    }
  },
  computed: {
    update() {
      return this.status.update || {}
    },
    updateAvailable() {
      return Boolean(this.update.available)
    },
    canApply() {
      return Boolean(this.updateAvailable && this.update.can_apply)
    },
    findings() {
      const findings = []
      if (this.updateAvailable) {
        findings.push(`Yeni Yetka sürümü: ${this.update.latest_version} (kurulu: ${this.update.current_version})`)
      }
      if (this.status.upstream?.review_required) {
        findings.push(`Yeni upstream sürümü inceleme bekliyor: ${this.status.upstream.latest_version} (Yetka tabanı: ${this.status.upstream.base_version}). Otomatik uygulanmaz.`)
      }
      if (this.status.vulnerabilities?.total) {
        findings.push(`${this.status.vulnerabilities.total} güvenlik kaydı, ${this.status.vulnerabilities.affected_packages} kurulu paketi etkiliyor.`)
      }
      if (this.status.errors?.length) {
        findings.push('Bakım taramasının bazı kaynaklarına ulaşılamadı; ağ ve scheduler loglarını kontrol edin.')
      }
      return findings
    }
  },
  mounted() {
    this.loadStatus()
  },
  methods: {
    isDismissed() {
      try {
        const saved = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
        return saved.fingerprint === this.status.fingerprint && Date.now() - saved.at < DISMISS_MS
      } catch (error) {
        return false
      }
    },
    async loadStatus() {
      try {
        this.status = await request.get(API_URL, { disableFlashErrorMsg: true })
        this.dialogVisible = Boolean(
          this.status.attention_required && this.status.fingerprint && !this.isDismissed()
        )
      } catch (error) {
        // Anonymous and non-superuser sessions must continue without a maintenance prompt.
      }
    },
    dismiss() {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ fingerprint: this.status.fingerprint, at: Date.now() }))
      this.dialogVisible = false
    },
    async applyUpdate() {
      try {
        await this.$confirm(
          `${this.update.latest_version} sürümü uygulanacak. Sunucu önce yedek alacak ve servisler kısa süreliğine kesilebilir. Devam edilsin mi?`,
          'Yetka güncellemesi',
          { type: 'warning' }
        )
      } catch (error) {
        return
      }
      this.applying = true
      try {
        await request.post(API_URL, { version: this.update.latest_version })
        this.$message.success('Güncelleme sıraya alındı.')
      } finally {
        this.applying = false
      }
    },
    async copyCommand() {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(this.update.command)
        this.$message.success('Komut kopyalandı.')
      }
    },
    openGuide() {
      window.open(this.status.guide_url, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<style lang="scss" scoped>
.yetka-update-control {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 1900;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 12px 12px 16px;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.22);

  div:first-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  small {
    color: #64748b;
  }
}

.update-command {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;

  code {
    padding: 9px;
    overflow: auto;
    border-radius: 6px;
    background: #172033;
    color: #f8fafc;
  }
}
</style>
