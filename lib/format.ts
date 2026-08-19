export const compactNumber = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatDate = (value: string) => new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
