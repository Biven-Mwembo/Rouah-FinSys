// src/hooks/useAuth.js (Create this file)

export const useUserRole = () => {
    // 1. Check for login token (general auth)
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
        return { role: 'guest', isLoggedIn: false };
    }
    
    // 2. Safely parse user data for the role
    try {
        const user = JSON.parse(userString);
        // Default to 'user' if role is somehow missing
        const role = user.role || 'user'; 
        return { 
            role: role, 
            isLoggedIn: true 
        };
    } catch (e) {
        // Clear storage if user data is corrupted
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { role: 'guest', isLoggedIn: false };
    }
};