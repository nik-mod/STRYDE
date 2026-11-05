const attempts = new Map<string, { count: number; reset: number }>();
export function allowOrderLookup(customerId: string, now = Date.now()) {
  for (const [key, value] of attempts) if (value.reset <= now) attempts.delete(key);
  const value = attempts.get(customerId);
  if (!value) {
    if (attempts.size >= 5000) return false;
    attempts.set(customerId, { count: 1, reset: now + 60000 });
    return true;
  }
  return ++value.count <= 10;
}
export function ownsTrackedOrder(order: { customer_id?: string; email?: string } | undefined, customerId: string, email: string) {
  return !!order && order.customer_id === customerId && String(order.email || "").trim().toLowerCase() === email.trim().toLowerCase();
}
