export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  hospital_name?: string;
  hospital_registration_number?: string;
  hospital_type?: string;
  mobile_number?: string;
  city?: string;
  state?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  displayName?: string;
  hospital_name?: string;
  hospital_registration_number?: string;
  hospital_type?: string;
  mobile_number?: string;
  city?: string;
  state?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: UserProfile;
}

const REGISTERED_USERS_KEY = "foceye_registered_users";

export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const userId = `user_${Date.now()}`;
    const token = `local_jwt_${Date.now()}`;

    const userProfile: UserProfile = {
      id: userId,
      email: trimmedEmail,
      full_name: data.full_name.trim(),
      displayName: data.full_name.trim(),
      hospital_name: data.hospital_name?.trim() || "FOCEYE Vision Hospital",
      hospital_registration_number: data.hospital_registration_number?.trim(),
      hospital_type: data.hospital_type,
      mobile_number: data.mobile_number,
      city: data.city,
      state: data.state,
    };

    // Store in local registered users database
    try {
      const existing = localStorage.getItem(REGISTERED_USERS_KEY);
      const list: Array<UserProfile & { password?: string }> = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((u) => u.email !== trimmedEmail);
      filtered.push({ ...userProfile, password: data.password });
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn("[authService] Failed to persist registered user:", err);
    }

    localStorage.setItem("foceye_token", token);
    localStorage.setItem("foceye_user", JSON.stringify(userProfile));

    return { access_token: token, token_type: "bearer", expires_in: 86400, user: userProfile };
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const token = `local_jwt_${Date.now()}`;

    let matchedUser: UserProfile | null = null;
    try {
      const existing = localStorage.getItem(REGISTERED_USERS_KEY);
      if (existing) {
        const list: Array<UserProfile & { password?: string }> = JSON.parse(existing);
        const found = list.find((u) => u.email === trimmedEmail);
        if (found) {
          matchedUser = {
            id: found.id,
            email: found.email,
            full_name: found.full_name,
            displayName: found.full_name,
            hospital_name: found.hospital_name || "FOCEYE Vision Hospital",
            hospital_registration_number: found.hospital_registration_number,
            hospital_type: found.hospital_type,
            mobile_number: found.mobile_number,
            city: found.city,
            state: found.state,
          };
        }
      }
    } catch (err) {
      console.warn("[authService] Login lookup error:", err);
    }

    if (!matchedUser) {
      matchedUser = {
        id: `user_${Date.now()}`,
        email: trimmedEmail,
        full_name: trimmedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Clinician",
        displayName: "Clinician",
        hospital_name: "FOCEYE Vision Hospital",
      };
    }

    localStorage.setItem("foceye_token", token);
    localStorage.setItem("foceye_user", JSON.stringify(matchedUser));

    return { access_token: token, token_type: "bearer", expires_in: 86400, user: matchedUser };
  },

  signInWithGoogle: async (): Promise<AuthResponse> => {
    const token = `local_jwt_${Date.now()}`;
    const userProfile: UserProfile = {
      id: `google_user_${Date.now()}`,
      email: "clinician.google@foceyehospital.com",
      full_name: "Dr. Sarah Jenkins",
      displayName: "Dr. Sarah Jenkins",
      hospital_name: "FOCEYE Vision Hospital",
    };

    localStorage.setItem("foceye_token", token);
    localStorage.setItem("foceye_user", JSON.stringify(userProfile));

    return { access_token: token, token_type: "bearer", expires_in: 86400, user: userProfile };
  },

  getUser: (): UserProfile | null => {
    try {
      const stored = localStorage.getItem("foceye_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getCurrentUser: (): UserProfile | null => {
    return authService.getUser();
  },

  getCurrentHospitalId: (): string => {
    try {
      const stored = localStorage.getItem("foceye_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.id) return `HOS-${user.id.slice(0, 8).toUpperCase()}`;
        if (user?.hospital_name) return `HOS-${user.hospital_name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;
      }
    } catch (err) {
      console.warn("[authService] Get hospital ID error:", err);
    }
    return "HOS-DEFAULT";
  },

  getCurrentHospitalName: (): string => {
    try {
      const stored = localStorage.getItem("foceye_user");
      if (stored) {
        const user = JSON.parse(stored);
        return user.hospital_name || "FOCEYE Vision Hospital";
      }
    } catch (err) {
      console.warn("[authService] Get hospital name error:", err);
    }
    return "FOCEYE Vision Hospital";
  },

  me: async () => {
    return authService.getUser();
  },

  logout: async () => {
    localStorage.removeItem("foceye_token");
    localStorage.removeItem("foceye_user");
  },
};
