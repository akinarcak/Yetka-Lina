import i18n from '@/i18n/i18n'

export default [
  {
    path: 'cloud-sync',
    name: 'CloudAccountList',
    component: () => import('@/views/cloudSync'),
    meta: {
      title: i18n.t('CloudSync'),
      icon: 'cloud',
      app: 'cloud_sync',
      resource: 'cloudsyncaccount',
      permissions: ['cloud_sync.view_cloudsyncaccount']
    }
  }
]
