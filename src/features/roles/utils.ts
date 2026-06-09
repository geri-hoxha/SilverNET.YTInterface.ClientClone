export function formatRoleLabel(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}
