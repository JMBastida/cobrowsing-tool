export function onDateFilter(event: any, dt: any, field: string, condition: string) {
  const date = new Date(event);
  date.setHours(23, 59, 59);
  dt.filter(date, field, condition);
};