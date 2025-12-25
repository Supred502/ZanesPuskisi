const ADMIN_UIDS = new Set([
  "NLL2HDQcDPVezIih8OKLJ0CCaGl2", // Admin Me
  "auIgf2eZJkQQffUD0bR4ZYuuArj2", // Admin Sister
  "hMWGIjyc3uR61GW12VdNYVV49px2", // Admin Mom
]);

export function isAdminUid(uid) {
  if (!uid) return false;
  return ADMIN_UIDS.has(uid);
}

export function isAdminUser(user) {
  return !!user && isAdminUid(user.uid);
}
