import {createContext, useState, useEffect, useContext} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        if (token){
            setUser({ token });
        }else{
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    //Login execution handler
    const Login = (newToken) =>{
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };
    
    //Logout execution handler
    const Logout= ()=>{
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, Login, Logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );

}

export const useAuth = () => useContext(AuthContext);