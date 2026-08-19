import type { ReactNode } from "react";

export type IconName =
  | "search"
  | "plus"
  | "edit"
  | "trash"
  | "close"
  | "heart"
  | "eye"
  | "save"
  | "upload"
  | "user"
  | "logout"
  | "filter"
  | "chevron"
  | "bell"
  | "mail"
  | "bookmark"
  | "bookmarkFill"
  | "more"
  | "briefcase"
  | "pin"
  | "check"
  | "arrow"
  | "clock"
  | "spark"
  | "comment"
  | "image"
  | "grid"
  | "video"
  | "code"
  | "cube"
  | "cursor"
  | "chevronUp"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "lock"
  | "link"
  | "paperclip";

const iconPaths: Record<IconName, ReactNode> = {
  search: <><circle cx="11" cy="11" r="6.3" /><path d="m16 16 4 4" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <><path d="m14 5 5 5" /><path d="M4 20h5L19 10a3.5 3.5 0 0 0-5-5L4 15v5Z" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  heart: <path d="M12 20s-8-4.7-8-10.4A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8 1.6C20 15.3 12 20 12 20Z" />,
  eye: <><path d="M3 12s3.2-5.5 9-5.5 9 5.5 9 5.5-3.2 5.5-9 5.5S3 12 3 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  save: <path d="M6 4h12v17l-6-3-6 3V4Z" />,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.9-4 3.6-6 8-6s7.1 2 8 6" /></>,
  logout: <><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5" /></>,
  filter: <><path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" /><circle cx="7" cy="7" r="1.5" /><circle cx="16" cy="12" r="1.5" /><circle cx="11" cy="17" r="1.5" /></>,
  chevron: <path d="m8 10 4 4 4-4" />,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  bookmark: <path d="M6 4h12v17l-6-3-6 3V4Z" />,
  bookmarkFill: <path fill="currentColor" stroke="none" d="M6 4h12v17l-6-3-6 3V4Z" />,
  more: <><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5h8v2" /><path d="M3 12h18" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  spark: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />,
  comment: <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 15-5-5-9 9" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m21 9-5 3 5 3V9Z" /></>,
  code: <><path d="m8 6-5 6 5 6" /><path d="m16 6 5 6-5 6" /></>,
  cube: <><path d="M12 3 3 8v8l9 5 9-5V8l-9-5Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></>,
  cursor: <path d="M5 3l14 7-6 2-2 6-6-15Z" />,
  chevronUp: <path d="m8 14 4-4 4 4" />,
  alignLeft: <path d="M4 6h16M4 12h10M4 18h13" />,
  alignCenter: <path d="M4 6h16M7 12h10M6 18h12" />,
  alignRight: <path d="M4 6h16M10 12h10M7 18h13" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  link: <><path d="m9 15 6-6" /><path d="M13 5.5 15 3.5a3.5 3.5 0 0 1 5 5L18 10.5" /><path d="M11 18.5 9 20.5a3.5 3.5 0 0 1-5-5L6 13.5" /></>,
  paperclip: <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3L15 8.5" />,
};

export function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}
