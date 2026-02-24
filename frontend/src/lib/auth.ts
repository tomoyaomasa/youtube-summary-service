import { Amplify } from "aws-amplify";
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "MOCK_POOL",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "MOCK_CLIENT",
    },
  },
});

const USE_MOCK_AUTH = !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

// モック認証用のローカルストレージキー
const MOCK_USER_KEY = "mock_auth_user";

export interface AuthUser {
  userId: string;
  email: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  if (USE_MOCK_AUTH) {
    const user: AuthUser = { userId: `mock-${Date.now()}`, email };
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    }
    return user;
  }

  await signIn({ username: email, password });
  const user = await getCurrentAuthUser();
  if (!user) throw new Error("ログインに失敗しました");
  return user;
}

export async function register(email: string, password: string): Promise<void> {
  if (USE_MOCK_AUTH) return;
  await signUp({ username: email, password, options: { userAttributes: { email } } });
}

export async function confirmRegistration(email: string, code: string): Promise<void> {
  if (USE_MOCK_AUTH) return;
  await confirmSignUp({ username: email, confirmationCode: code });
}

export async function logout(): Promise<void> {
  if (USE_MOCK_AUTH) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_USER_KEY);
    }
    return;
  }
  await signOut();
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  if (USE_MOCK_AUTH) {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(MOCK_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const email =
      (session.tokens?.idToken?.payload?.email as string) || "";
    return { userId: user.userId, email };
  } catch {
    return null;
  }
}
