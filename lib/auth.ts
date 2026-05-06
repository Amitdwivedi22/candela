import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import connectToDatabase from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectToDatabase();

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
    Credentials({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        if (!firebaseApiKey) {
          console.error("Firebase auth error: NEXT_PUBLIC_FIREBASE_API_KEY is missing");
          return null;
        }

        try {
          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: credentials.idToken as string }),
            }
          );
          const data = await res.json();
          if (data.error || !data.users || data.users.length === 0) {
            console.error("Firebase auth lookup failed:", data.error ?? "No users returned");
            return null;
          }

          const firebaseUser = data.users[0];
          await connectToDatabase();

          let user = await User.findOne({ email: firebaseUser.email.toLowerCase() });
          if (!user) {
            user = await User.create({
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              email: firebaseUser.email.toLowerCase(),
              image: firebaseUser.photoUrl || undefined,
              provider: "google",
            });
          }
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Firebase auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        try {
          const email = user.email?.toLowerCase();
          if (!email) return false;
          
          const existingUser = await User.findOne({ email });
          if (!existingUser) {
            await User.create({
              name: user.name || email.split("@")[0],
              email: email,
              image: user.image || undefined,
              provider: "google",
            });
          }
          return true;
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === "google") {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email?.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
          }
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
