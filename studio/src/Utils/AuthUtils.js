export const getUserRole = () => {
  const studioUser = localStorage.getItem('studioUser');
  if (!studioUser) return null;
  
  try {
    const user = JSON.parse(studioUser);
    return user.role || null;
  } catch (e) {
    return null;
  }
};

export const isSeller = () => {
  return getUserRole() === 'seller';
};

export const isInfluencer = () => {
  return getUserRole() === 'influencer';
};

export const redirectToDashboard = () => {
  const role = getUserRole();
  if (role === 'seller') {
    return '/studio/seller';
  } else if (role === 'influencer') {
    return '/studio/influencer';
  }
  return '/studio/dashboard';
};

export const logout = () => {
  localStorage.removeItem('studioToken');
  localStorage.removeItem('studioUser');
};