type FirebaseAuthLikeError = {
  code?: string;
  message?: string;
};

export function getFirebaseAuthErrorMessage(error: unknown) {
  const firebaseError = error as FirebaseAuthLikeError;
  const code = firebaseError?.code ?? "";
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "this domain";

  switch (code) {
    case "auth/unauthorized-domain":
      return `Google sign-in is not enabled for ${hostname}. Use http://localhost:3000 for local development, and add ${hostname} to Firebase Console > Authentication > Settings > Authorized domains before using Google sign-in here.`;
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled before completion.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.";
    case "auth/network-request-failed":
      return "Google sign-in failed because the network request did not complete. Check your connection and try again.";
    default:
      return firebaseError?.message || "Failed to sign in with Google.";
  }
}

export function getLocalhostRedirectUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.location.hostname !== "127.0.0.1") {
    return null;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.hostname = "localhost";
  return nextUrl.toString();
}
