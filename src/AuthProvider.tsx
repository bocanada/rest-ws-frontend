import { createContext, createSignal, ParentComponent, useContext } from "solid-js";



const factoryAuthProvider = (t: string) => {
    const sessionStorage = window.sessionStorage;
    const initialValue = sessionStorage.getItem("authorization") || t
    const [token, innerSetToken] = createSignal(initialValue)
    const initialValueU = sessionStorage.getItem("user") || ""
    const [userId, setUserId] = createSignal(initialValueU)
    return [
        token,
        userId,
        {
            setToken(token: string) {
                sessionStorage.setItem("authorization", token)
                innerSetToken(token)
            },
            setUserId(userId: string) {
                sessionStorage.setItem("user", userId)
                setUserId(userId)
            },
            clearAuth() {
                sessionStorage.removeItem("authorization");
                sessionStorage.removeItem("user");
                innerSetToken("");
                setUserId("")
            },
        }
    ] as const;
}

type Thing = ReturnType<typeof factoryAuthProvider>

const AuthContext = createContext<Thing>();

export const AuthProvider: ParentComponent<{ token?: string }> = (props) => {
    const store = factoryAuthProvider(props.token || "");
    return (
        <AuthContext.Provider value={store}>
            {props.children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)!;