export const shouldForceLogoutOnRefreshFailure = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};
