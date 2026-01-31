import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../Config/axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    
                    // Fetch user group details
                    await fetchUserGroup(parsedUser.role);
                } catch (error) {
                    console.error('Error initializing user:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initializeUser();
    }, []);

    const fetchUserGroup = async (groupId) => {
        if (!groupId) {
            setUserGroup(null);
            return;
        }
        try {
            const response = await api.get(`/Users/group/${groupId}`);
            
            if (response.data && response.data.success) {
                setUserGroup(response.data.data);
            } else {
                console.warn('Failed to fetch user group:', response.data?.message || 'Unknown error');
                setUserGroup(null);
            }
        } catch (error) {
            // Only log non-401 errors to avoid console spam
            if (error.response?.status !== 401) {
                console.warn('Error fetching user group:', error.response?.data?.message || error.message);
            }
            setUserGroup(null);
        }
    };

    const login = async (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        await fetchUserGroup(userData.role);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setUserGroup(null);
    };

    const hasPermission = (permission) => {
        if (!userGroup) return false;
        // Check if user has either access or modification permissions
        return ( (userGroup.access_permissions || userGroup.accessPermissions) && (userGroup.access_permissions || userGroup.accessPermissions).includes(permission) ) || 
               ( (userGroup.modification_permissions || userGroup.modificationPermissions) && (userGroup.modification_permissions || userGroup.modificationPermissions).includes(permission) );
    };

    const value = {
        user,
        userGroup,
        loading,
        login,
        logout,
        hasPermission
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};