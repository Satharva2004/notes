import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const auth = {
  signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: opts?.redirect_uri,
        queryParams: opts?.extraParams,
      },
    });
  },
};
