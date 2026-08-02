export type BusinessStatus = "pending_approval" | "approved" | "rejected" | "suspended";
export type UserRole = "owner" | "admin" | "agent" | "viewer";
export type ChannelType = "instagram" | "whatsapp" | "facebook" | "messenger" | "telegram";
export type ConnectionStatus = "connected" | "ready_to_connect" | "expired" | "disabled";
export type AutomationStatus = "active" | "draft" | "paused";
export type LeadStatus = "new" | "qualified" | "follow_up" | "converted" | "lost";

export type Profile = {
  id: string;
  business_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  status: BusinessStatus;
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Business = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  status: BusinessStatus;
  plan: string;
  created_at: string;
  updated_at: string;
};
