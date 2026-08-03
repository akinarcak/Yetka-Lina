import zh from './zh.json'
import zh_hant from './zh_hant.json'
import en from './en.json'
import ja from './ja.json'
import tr from './tr.json'

// Map app locales to Element-UI locale file names
const elementLocaleNameByAppLocale = {
  zh: 'zh-CN',
  zh_hant: 'zh-TW',
  en: 'en',
  ja: 'ja',
  tr: 'en',
  pt_br: 'pt-br',
  es: 'es',
  ru: 'ru-RU',
  ko: 'ko',
  vi: 'vi'
}

function loadElementLocale(localeName) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const mod = require(`element-ui/lib/locale/lang/${localeName}`)
    return (mod && (mod.default || mod)) || {}
  } catch (e) {
    return {}
  }
}

const appLocaleMessages = {
  zh,
  zh_hant,
  en,
  ja,
  tr: { ...en, ...tr }
}

const messages = Object.keys(elementLocaleNameByAppLocale).reduce((acc, appLocale) => {
  const elementLocaleName = elementLocaleNameByAppLocale[appLocale]
  const elementLocale = loadElementLocale(elementLocaleName)
  const appMessages = appLocaleMessages[appLocale] || {}
  acc[appLocale] = { ...elementLocale, ...appMessages }
  return acc
}, {})

export default messages
