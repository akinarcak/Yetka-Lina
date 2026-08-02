import request from '@/utils/request'

// Resolve i18n lazily. This module is loaded while the i18n module itself is
// initialising; an eager import leaves the partially constructed export
// undefined and crashes the whole SPA before the first route renders.
const translate = key => {
  const mod = require('@/i18n/i18n')
  return (mod.default || mod.a).t(key)
}

export const Required = {
  required: true, message: 'This field is required.', trigger: 'blur'
}

export const RequiredChange = {
  required: true, message: 'This field is required.', trigger: 'change'
}

export const EmailCheck = {
  type: 'email',
  message: 'Please enter a valid email address.',
  trigger: ['blur', 'change']
}

export const LengthCheck = {
  validator: (rule, value, callback) => {
    if (value < 30) {
      callback(new Error(`${translate('MinNumber30')}`))
    } else {
      callback()
    }
  },
  type: 'number',
  trigger: ['blur', 'change']
}

export const IpCheck = {
  required: true,
  validator: (rule, value, callback) => {
    value = value?.trim()
    const urlRegExp = /^[\w://.?=&#-]+$/
    if (urlRegExp.test(value)) {
      callback()
    } else {
      callback(new Error(translate('FormatError')))
    }
  },
  trigger: ['blur', 'change']
}

export const specialEmojiCheck = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (/[\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/.test(value)) {
      callback(new Error(translate('NotSpecialEmoji')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

// 只能输入字母、数字、下划线
export const matchAlphanumericUnderscore = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      callback(new Error(translate('notAlphanumericUnderscore')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

// 不能包含()
export const MatchExcludeParenthesis = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (!/^[^()]*$/.test(value)) {
      callback(new Error(translate('notParenthesis')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

export const JsonRequired = {
  required: true,
  trigger: 'change',
  validator: (rule, value, callback) => {
    try {
      typeof value === 'string' ? JSON.parse(value) : value
      callback()
    } catch (e) {
      callback(new Error(translate('InvalidJson')))
    }
  }
}

export const JsonRequiredUserNameMapped = {
  required: true,
  trigger: 'change',
  validator: (rule, value, callback) => {
    try {
      const v = typeof value === 'string' ? JSON.parse(value) : value
      const hasUserName = _.map(v, (value) => value)
      if (!hasUserName.includes('username')) {
        callback(new Error(translate('requiredHasUserNameMapped')))
      }
      callback()
    } catch (e) {
      callback(new Error(translate('InvalidJson')))
    }
  }
}

export default {
  IpCheck,
  Required,
  LengthCheck,
  RequiredChange,
  EmailCheck,
  specialEmojiCheck,
  matchAlphanumericUnderscore,
  MatchExcludeParenthesis
}
/**
 * @description 表单唯一性校验
 *
 * @param {Object} options
 * @param {string} 列表查询地址
 * @param {string} 查询参数名
 * @param {string} 字段中文名
 * @param {string} 字段名
 * @param {function(): (string|number)} 返回更新场景下的当前对象 id
 */
export function UniqueCheck(options = {}) {
  const { url, param, label, fieldName, getIgnoreId } = options

  function existsInResponse(res) {
    if (Array.isArray(res)) return res.length > 0
    if (res && typeof res === 'object') {
      if (typeof res.count === 'number') return res.count > 0
      if (Array.isArray(res.results)) return res.results.length > 0
    }
    return !!res
  }

  function extractIds(res) {
    if (Array.isArray(res)) return res.map(i => i?.id).filter(Boolean)
    if (res && Array.isArray(res.results)) return res.results.map(i => i?.id).filter(Boolean)
    return []
  }

  return {
    async validator(rule, value, callback) {
      try {
        let v = value

        if (typeof v === 'string') v = v.trim()
        if (v === '' || v === undefined || v === null) return callback()
        if (!url || !param) return callback()

        const res = await request.get(url, { params: { [param]: v } })
        let duplicated = existsInResponse(res)

        if (duplicated && typeof getIgnoreId === 'function') {
          const curId = getIgnoreId()
          if (curId) {
            const ids = extractIds(res)

            // 查询结果只包含自身,因此不被视为重复
            if (ids.length >= 1 && ids.every(id => id === curId)) {
              duplicated = false
            }
          }
        }

        if (duplicated) {
          const _label = label || fieldName || ''
          const msg = `${_label}${translate('Existing')}`
          callback(new Error(msg))
        } else {
          callback()
        }
      } catch (e) {
        callback()
      }
    },
    trigger: ['blur']
  }
}
