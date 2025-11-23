import twilio from "twilio";

interface SendIconLinkSmsParams {
  phoneNumber: string;
  appUrl: string;
}

interface SendCouponSmsParams {
  phoneNumber: string;
  couponCode: string;
  offerTitle: string;
  businessName: string;
  expiryDate?: string;
}

interface SendNotificationSmsParams {
  phoneNumber: string;
  message: string;
}

interface SendCampaignSmsParams {
  phoneNumber: string;
  message: string;
  businessName: string;
}

interface SendSmsResult {
  success: boolean;
  error?: string;
  sid?: string;
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

export async function sendIconLinkSms({
  phoneNumber,
  appUrl,
}: SendIconLinkSmsParams): Promise<SendSmsResult> {
  const message = `Urly Byrd: Thanks for joining! Tap to add the Urly Byrd icon link to your phone: ${appUrl}. Reply STOP to opt out.`;

  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log("📱 [SMS Service] Twilio not configured. Would send message to", phoneNumber);
    console.log("📱 Message content:", message);
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      to: `+1${phoneNumber}`,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("📱 [SMS Service] Icon link sent successfully:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("📱 [SMS Service] Failed to send icon link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendCouponSms({
  phoneNumber,
  couponCode,
  offerTitle,
  businessName,
  expiryDate,
}: SendCouponSmsParams): Promise<SendSmsResult> {
  const expiryText = expiryDate ? ` Expires: ${expiryDate}.` : '';
  const message = `${businessName}: Your coupon code is ${couponCode} for ${offerTitle}.${expiryText} Show at checkout. Reply STOP to opt out.`;

  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log("📱 [SMS Service] Twilio not configured. Would send coupon to", phoneNumber);
    console.log("📱 Message content:", message);
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      to: `+1${phoneNumber}`,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("📱 [SMS Service] Coupon sent successfully:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("📱 [SMS Service] Failed to send coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendNotificationSms({
  phoneNumber,
  message,
}: SendNotificationSmsParams): Promise<SendSmsResult> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log("📱 [SMS Service] Twilio not configured. Would send notification to", phoneNumber);
    console.log("📱 Message content:", message);
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      to: `+1${phoneNumber}`,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("📱 [SMS Service] Notification sent successfully:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("📱 [SMS Service] Failed to send notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendCampaignSms({
  phoneNumber,
  message,
  businessName,
}: SendCampaignSmsParams): Promise<SendSmsResult> {
  const fullMessage = `${businessName}: ${message} Reply STOP to opt out.`;

  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log("📱 [SMS Service] Twilio not configured. Would send campaign to", phoneNumber);
    console.log("📱 Message content:", fullMessage);
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: fullMessage,
      to: `+1${phoneNumber}`,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("📱 [SMS Service] Campaign sent successfully:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("📱 [SMS Service] Failed to send campaign:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isTwilioConfigured(): boolean {
  return !!(twilioClient && TWILIO_PHONE_NUMBER);
}
