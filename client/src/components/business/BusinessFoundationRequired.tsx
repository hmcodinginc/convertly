import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"

function BusinessFoundationRequired() {
  return (
    <Card className="app-card-body app-card-stack hover:translate-y-0">
      <Text size="sm" className="max-w-none font-medium">
        Supabase required
      </Text>
      <Text variant="muted" size="sm" className="max-w-none leading-6">
        {isBusinessFoundationEnabled()
          ? "Unable to load account data."
          : "Configure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and set VITE_USE_LOCAL_AUTH=false to enable workspace, billing, and settings."}
      </Text>
    </Card>
  )
}

export { BusinessFoundationRequired }
