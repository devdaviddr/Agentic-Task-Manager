export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using semantic text color tokens (text-heading/body/muted) instead of arbitrary Tailwind text color classes.',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [],
    messages: {
      avoidColor: 'Avoid using raw Tailwind text color class "{{className}}". Use semantic tokens like text-heading/text-body/text-muted (or text-primary/text-secondary/etc.) instead.',
    },
  },
  create(context) {
    const allowedTextClasses = new Set([
      'text-heading',
      'text-body',
      'text-muted',
      'text-primary',
      'text-secondary',
      'text-tertiary',
      'text-danger',
      'text-page',
      'text-transparent',
      'text-xs',
      'text-sm',
      'text-base',
      'text-lg',
      'text-xl',
      'text-2xl',
      'text-3xl',
      'text-4xl',
      'text-5xl',
      'text-6xl',
      'text-7xl',
      'text-8xl',
      'text-9xl',
      'text-left',
      'text-center',
      'text-right',
      'text-justify',
    ])

    const isAllowed = (className) => {
      if (allowedTextClasses.has(className)) return true
      if (/^text-opacity-\d{1,3}$/.test(className)) return true
      if (/^text-(heading|body|muted|primary|secondary|tertiary|danger)(?:\/\d+)?$/.test(className)) return true
      return false
    }

    const disallowedColorPattern = /^text-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?(?:\/\d+)?$/

    const reportIfInvalid = (className, node) => {
      if (!className.startsWith('text-')) return
      if (isAllowed(className)) return
      if (!disallowedColorPattern.test(className)) return
      context.report({ node, messageId: 'avoidColor', data: { className } })
    }

    const checkClassList = (value, node) => {
      if (typeof value !== 'string') return
      value.split(/\s+/).filter(Boolean).forEach((cls) => reportIfInvalid(cls, node))
    }

    const extractClassNames = (node) => {
      if (!node || !node.value) return
      const { value } = node

      if (value.type === 'Literal' && typeof value.value === 'string') {
        checkClassList(value.value, node)
        return
      }

      if (value.type === 'JSXExpressionContainer') {
        const expr = value.expression
        if (expr.type === 'Literal' && typeof expr.value === 'string') {
          checkClassList(expr.value, node)
        } else if (expr.type === 'TemplateLiteral') {
          expr.quasis.forEach((quasi) => {
            checkClassList(quasi.value.raw, node)
          })
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === 'className') {
          extractClassNames(node)
        }
      },
    }
  },
}
