<template>
  <el-dialog title="Cloud sync account" :visible.sync="dialogVisible" width="620px" @close="$emit('close')">
    <el-form ref="form" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Name" prop="name">
            <el-input v-model.trim="form.name" autocomplete="off" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Provider" prop="provider">
            <el-select v-model="form.provider" style="width: 100%">
              <el-option label="Amazon Web Services" value="aws" />
              <el-option label="Microsoft Azure" value="azure" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="form.provider === 'aws'">
        <el-form-item label="Access key ID" prop="credentials.access_key_id">
          <el-input v-model.trim="form.credentials.access_key_id" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Secret access key" prop="credentials.secret_access_key">
          <el-input v-model="form.credentials.secret_access_key" type="password" autocomplete="new-password" show-password />
        </el-form-item>
        <el-form-item label="Custom endpoint (optional, operator allowlist required)">
          <el-input v-model.trim="form.credentials.endpoint_url" placeholder="https://ec2.example.internal" />
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item v-for="field in azureFields" :key="field.key" :label="field.label" :prop="`credentials.${field.key}`">
          <el-input
            v-model.trim="form.credentials[field.key]"
            :type="field.secret ? 'password' : 'text'"
            :autocomplete="field.secret ? 'new-password' : 'off'"
            :show-password="field.secret"
          />
        </el-form-item>
      </template>

      <el-form-item label="Regions (comma separated; empty discovers all)">
        <el-input v-model.trim="regions" placeholder="eu-central-1, westeurope" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Hostname strategy">
            <el-select v-model="form.hostname_strategy" style="width: 100%">
              <el-option label="Instance name" value="instance_name" />
              <el-option label="Instance ID" value="instance_id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Address policy">
            <el-switch v-model="form.use_public_ip" active-text="Prefer public IP" inactive-text="Prefer private IP" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div slot="footer">
      <el-button @click="$emit('close')">Cancel</el-button>
      <el-button type="primary" :loading="saving" @click="submit">Create account</el-button>
    </div>
  </el-dialog>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'CloudSyncAccountDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      dialogVisible: this.visible,
      saving: false,
      regions: '',
      azureFields: [
        { key: 'tenant_id', label: 'Azure tenant ID' },
        { key: 'client_id', label: 'Client ID' },
        { key: 'client_secret', label: 'Client secret', secret: true },
        { key: 'subscription_id', label: 'Subscription ID' }
      ],
      form: {
        name: '', provider: 'aws', credentials: {},
        hostname_strategy: 'instance_name', use_public_ip: false, is_active: true
      },
      rules: {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        provider: [{ required: true, message: 'Provider is required', trigger: 'change' }]
      }
    }
  },
  watch: {
    visible(value) {
      this.dialogVisible = value
    },
    'form.provider'() {
      this.form.credentials = {}
    }
  },
  methods: {
    submit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.saving = true
        try {
          const payload = {
            ...this.form,
            regions: this.regions.split(',').map(item => item.trim()).filter(Boolean)
          }
          await request.post('/api/v1/cloud-sync/accounts/', payload)
          this.$message.success('Cloud sync account created')
          this.$emit('saved')
          this.$emit('close')
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>
