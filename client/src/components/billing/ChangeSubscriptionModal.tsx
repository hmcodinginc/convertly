import { Button } from "@/components/ui/button"
import { Modal } from "@/components/feedback/Modal"
import { Text } from "@/components/ui/typography/Text"
type ChangeSubscriptionModalProps = {
  open: boolean
  targetPlanName: string
  renewalDate: string | null
  isSubmitting?: boolean
  onClose: () => void
  onKeepCurrentPlan: () => void
  onCancelAndChooseNextPlan: () => void
}

function ChangeSubscriptionModal({
  open,
  targetPlanName,
  renewalDate,
  isSubmitting = false,
  onClose,
  onKeepCurrentPlan,
  onCancelAndChooseNextPlan,
}: ChangeSubscriptionModalProps) {
  const renewalLabel = renewalDate ?? "the end of your billing period"

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title="Change your subscription"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onKeepCurrentPlan}
            disabled={isSubmitting}
          >
            Keep Current Plan
          </Button>
          <Button onClick={onCancelAndChooseNextPlan} disabled={isSubmitting}>
            {isSubmitting ? "Saving your choice…" : "Cancel & Choose Next Plan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Text size="sm" className="max-w-none leading-6 text-foreground/90">
          Due to Razorpay&apos;s rules for recurring payment mandates (cards, UPI, and
          eMandate), your current subscription cannot be changed directly.
        </Text>
        <Text size="sm" className="max-w-none leading-6 text-muted">
          Your current subscription will remain active until {renewalLabel}. You can choose
          your next plan now, and we&apos;ll remember it.
        </Text>
        <Text size="sm" className="max-w-none font-medium text-foreground">
          Next plan: {targetPlanName}
        </Text>
      </div>
    </Modal>
  )
}

export { ChangeSubscriptionModal }
export type { ChangeSubscriptionModalProps }
