import VueCookie from 'vue-cookie'

export function getLangCode(withInternalCode = false) {
  const cookieLang = VueCookie.get('django_language')
  let lang = cookieLang || navigator.language.toLowerCase()
  // The UI ships a finite set of locale bundles. Browsers may report a
  // regional locale (for example tr-tr) that has no bundled translation;
  // normalise regional variants and fall back before VueI18n initialises.
  const localeAliases = {
    'zh-cn': 'zh',
    'zh-sg': 'zh',
    'zh-tw': 'zh_hant',
    'zh-hk': 'zh_hant',
    'pt-pt': 'pt_br'
  }
  lang = localeAliases[lang] || lang
  if (!['zh', 'zh_hant', 'en', 'ja', 'pt_br', 'es', 'ru', 'ko', 'vi'].includes(lang)) {
    const base = lang.split('-')[0]
    lang = ['zh', 'ja', 'es', 'ru', 'ko', 'vi'].includes(base) ? base : 'en'
  }
  if (withInternalCode) {
    const { default: store } = require('@/store')
    const languages = store.getters.publicSettings['LANGUAGES']
    for (const langObj of languages) {
      if (langObj['other_codes'].indexOf(lang) > -1) {
        lang = langObj['code']
        break
      }
    }
  }
  return lang
}

