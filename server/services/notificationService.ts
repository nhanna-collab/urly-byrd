import type { DatabaseStorage } from "../storage";
import type { NotificationType, NotificationPriority, InsertNotification } from "@shared/schema";

export class NotificationService {
  constructor(private storage: DatabaseStorage) {}

  async notify(params: {
    merchantId: string;
    type: NotificationType;
    message: string;
    priority?: NotificationPriority;
    offerId?: string;
    actionUrl?: string;
  }): Promise<void> {
    const { merchantId, type, message, priority = "normal", offerId, actionUrl } = params;

    const prefs = await this.storage.getNotificationPreferences(merchantId);
    
    if (!prefs) {
      await this.createNotification({ merchantId, type, message, priority, offerId, actionUrl });
      return;
    }

    const shouldNotify = this.shouldSendNotification(type, prefs, priority);
    if (!shouldNotify) {
      console.log(`[NotificationService] Skipping notification type ${type} for merchant ${merchantId} (disabled in preferences)`);
      return;
    }

    const isInQuietHours = this.isInQuietHours(prefs, priority);
    if (isInQuietHours) {
      console.log(`[NotificationService] Delaying notification type ${type} (quiet hours)`);
      return;
    }

    await this.createNotification({ merchantId, type, message, priority, offerId, actionUrl });

    if (prefs.smsEnabled && this.shouldSendToChannel("sms", priority)) {
      console.log(`[NotificationService] TODO: Send SMS notification for ${type}`);
    }

    if (prefs.emailEnabled && this.shouldSendToChannel("email", priority)) {
      console.log(`[NotificationService] TODO: Send email notification for ${type}`);
    }
  }

  private async createNotification(params: Omit<InsertNotification, "id" | "createdAt">): Promise<void> {
    await this.storage.createNotification(params);
  }

  private shouldSendNotification(
    type: NotificationType,
    prefs: any,
    priority: NotificationPriority
  ): boolean {
    // Urgent and high priority notifications always send (bypass preferences)
    if (priority === "urgent" || priority === "high") return true;

    if (type === "system_alert") return true;

    const prefMap: Record<string, string> = {
      auto_extend: "notifyAutoExtend",
      shortfall_warning: "notifyShortfall",
      offer_expired: "notifyExpired",
      offer_activated: "notifyActivated",
      budget_warning: "notifyBudgetWarning",
      budget_depleted: "notifyBudgetDepleted",
      max_clicks_reached: "notifyMaxClicks",
      target_met: "notifyTargetMet",
      poor_performance: "notifyPoorPerformance",
    };

    const prefKey = prefMap[type];
    return prefs[prefKey] ?? true;
  }

  private isInQuietHours(prefs: any, priority: NotificationPriority): boolean {
    if (priority === "urgent" || priority === "high") return false;
    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    const start = prefs.quietHoursStart;
    const end = prefs.quietHoursEnd;

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      return currentTime >= start || currentTime < end;
    }
  }

  private shouldSendToChannel(channel: "sms" | "email", priority: NotificationPriority): boolean {
    if (priority === "urgent") return true;
    if (priority === "high" && channel === "sms") return true;
    return false;
  }

  async notifyAutoExtend(merchantId: string, offerId: string, offerTitle: string, extensionDays: number, unitsSold: number, targetUnits: number): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "auto_extend",
      priority: "normal",
      message: `Your offer "${offerTitle}" was automatically extended by ${extensionDays} days because only ${unitsSold} of ${targetUnits} units were sold.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyShortfall(merchantId: string, offerId: string, offerTitle: string, unitsSold: number, targetUnits: number): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "shortfall_warning",
      priority: "normal",
      message: `Your offer "${offerTitle}" is expiring soon. Only ${unitsSold} of ${targetUnits} units sold. Consider extending the offer.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyOfferExpired(merchantId: string, offerId: string, offerTitle: string): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "offer_expired",
      priority: "low",
      message: `Your offer "${offerTitle}" has ended and moved to Expired.`,
      actionUrl: `/offers?view=expired`,
    });
  }

  async notifyOfferActivated(merchantId: string, offerId: string, offerTitle: string): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "offer_activated",
      priority: "high",
      message: `Your offer "${offerTitle}" is now live and accepting claims!`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyBudgetWarning(merchantId: string, offerId: string, offerTitle: string, percentRemaining: number): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "budget_warning",
      priority: "high",
      message: `Your offer "${offerTitle}" has only ${percentRemaining}% of its click budget remaining.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyBudgetDepleted(merchantId: string, offerId: string, offerTitle: string): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "budget_depleted",
      priority: "urgent",
      message: `Your offer "${offerTitle}" has reached its click budget limit and has been paused.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyMaxClicksReached(merchantId: string, offerId: string, offerTitle: string): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "max_clicks_reached",
      priority: "high",
      message: `Your offer "${offerTitle}" has reached the maximum number of allowed clicks.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyTargetMet(merchantId: string, offerId: string, offerTitle: string, targetUnits: number): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "target_met",
      priority: "normal",
      message: `Congratulations! Your offer "${offerTitle}" has met its target of ${targetUnits} units sold.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }

  async notifyPoorPerformance(merchantId: string, offerId: string, offerTitle: string): Promise<void> {
    await this.notify({
      merchantId,
      offerId,
      type: "poor_performance",
      priority: "low",
      message: `Your offer "${offerTitle}" has low engagement. Consider adjusting the discount or targeting.`,
      actionUrl: `/offer-form/${offerId}`,
    });
  }
}
