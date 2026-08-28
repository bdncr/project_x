export type SettingsSection = "profile" | "password" | "email" | "security";

export const SETTINGS_SECTIONS: [SettingsSection, string, string][] = [
  ["profile", "Профайл", "Нэр, мэргэжил, байршил, зурагнууд"],
  ["password", "Нууц үг", "Нэвтрэх нууц үгээ солих"],
  ["email", "Имэйл", "Нэвтрэх имэйл хаягаа солих"],
  ["security", "Аюулгүй байдал", "Идэвхтэй сешн, гарах"],
];
