export const isPlainObject = (val: any) => {
  return typeof val === "object" && val !== null && !Array.isArray(val);
};

export const isArray = (val: any) => {
  return Array.isArray(val);
};

export const getValidRoute = (route: string): string => {
  const validRoute = `${route}`.startsWith("/") ? `${route}` : "/" + route;
  return validRoute;
};

export const isEmpty = (val: any) => {
  if (typeof val === "string" && val.length === 0) return true;
  if (val === null) return true;
  if (val === undefined) return true;
  if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0) return true;
  if (typeof val === "object" && Array.isArray(val) && val.length === 0) return true;

  return false;
};
