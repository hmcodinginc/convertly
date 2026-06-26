import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"

const REGISTRY_GLOBAL_KEY = "__convertlyAuditRuleRegistry__"

type RegistryOptions = {
  disabledRuleIds?: string[]
  enabledOnly?: boolean
  categories?: IntelligenceCategory[]
  tags?: string[]
  version?: RuleDefinition["version"]
}

export class RuleRegistry {
  private readonly rules = new Map<string, RuleDefinition>()
  private readonly rulesByCategory = new Map<IntelligenceCategory, RuleDefinition[]>()
  private readonly rulesByTag = new Map<string, RuleDefinition[]>()

  register(rule: RuleDefinition): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule already registered: ${rule.id}`)
    }

    this.rules.set(rule.id, rule)
    this.indexRule(rule)
  }

  registerMany(rules: RuleDefinition[]): void {
    for (const rule of rules) {
      this.register(rule)
    }
  }

  isInitialized(): boolean {
    return this.rules.size > 0
  }

  private indexRule(rule: RuleDefinition): void {
    const categoryRules = this.rulesByCategory.get(rule.category) ?? []
    categoryRules.push(rule)
    this.rulesByCategory.set(rule.category, categoryRules)

    for (const tag of rule.tags) {
      const tagged = this.rulesByTag.get(tag) ?? []
      tagged.push(rule)
      this.rulesByTag.set(tag, tagged)
    }
  }

  getById(id: string): RuleDefinition | undefined {
    return this.rules.get(id)
  }

  getByIds(ids: string[]): RuleDefinition[] {
    return ids
      .map((id) => this.rules.get(id))
      .filter((rule): rule is RuleDefinition => Boolean(rule?.enabled))
  }

  getAll(): RuleDefinition[] {
    return [...this.rules.values()]
  }

  getByCategory(category: IntelligenceCategory): RuleDefinition[] {
    return [...(this.rulesByCategory.get(category) ?? [])]
  }

  getByTag(tag: string): RuleDefinition[] {
    return [...(this.rulesByTag.get(tag) ?? [])]
  }

  getSiteRules(options: RegistryOptions = {}): RuleDefinition[] {
    return this.filterRules(options).filter((rule) => rule.enabled && rule.scope === "site")
  }

  setEnabled(id: string, enabled: boolean): void {
    const rule = this.rules.get(id)
    if (!rule) return
    rule.enabled = enabled
  }

  private filterRules(options: RegistryOptions): RuleDefinition[] {
    const disabled = new Set(options.disabledRuleIds ?? [])
    const tagFilter = options.tags ? new Set(options.tags) : null
    const categoryFilter = options.categories ? new Set(options.categories) : null

    return this.getAll().filter((rule) => {
      if (options.enabledOnly && !rule.enabled) return false
      if (disabled.has(rule.id)) return false
      if (options.version && rule.version !== options.version) return false
      if (categoryFilter && !categoryFilter.has(rule.category)) return false
      if (tagFilter && !rule.tags.some((tag) => tagFilter.has(tag))) return false
      return true
    })
  }
}

type GlobalScope = typeof globalThis & {
  [REGISTRY_GLOBAL_KEY]?: RuleRegistry
}

function getGlobalRegistry(): RuleRegistry {
  const globalScope = globalThis as GlobalScope

  if (!globalScope[REGISTRY_GLOBAL_KEY]) {
    globalScope[REGISTRY_GLOBAL_KEY] = new RuleRegistry()
  }

  return globalScope[REGISTRY_GLOBAL_KEY]
}

export function getRuleRegistry(): RuleRegistry {
  return getGlobalRegistry()
}
