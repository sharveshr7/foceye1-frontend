import { describe, it, expect, beforeEach, vi } from "vitest";
import { authService, isTokenExpired } from "@/services/auth.service";
import { ApiClient } from "@/services/api.client";

describe("authService & ApiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    ApiClient.setToken(null);
    vi.restoreAllMocks();
  });

  it("manages tokens harmoniously across ApiClient and localStorage", () => {
    expect(ApiClient.getToken()).toBeNull();
    expect(ApiClient.isAuthenticated()).toBe(false);

    ApiClient.setToken("test_bearer_jwt_123");
    expect(ApiClient.getToken()).toBe("test_bearer_jwt_123");
    expect(localStorage.getItem("foceye_auth_token")).toBe("test_bearer_jwt_123");
    expect(localStorage.getItem("foceye_token")).toBe("test_bearer_jwt_123");
    expect(ApiClient.isAuthenticated()).toBe(true);

    ApiClient.setToken(null);
    expect(ApiClient.getToken()).toBeNull();
    expect(localStorage.getItem("foceye_auth_token")).toBeNull();
    expect(localStorage.getItem("foceye_token")).toBeNull();
    expect(ApiClient.isAuthenticated()).toBe(false);
  });

  it("handles offline clinician login fallback gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network Error (Server Offline)"));

    const res = await authService.login({
      email: "dr.smith@foceye.clinic",
      password: "Password123!",
    });

    expect(res.access_token).toBeDefined();
    expect(ApiClient.getToken()).toBe(res.access_token);
    expect(authService.getUser()?.email).toBe("dr.smith@foceye.clinic");
    expect(authService.isAuthenticated()).toBe(true);

    await authService.logout();
    expect(ApiClient.getToken()).toBeNull();
    expect(authService.getUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("detects and purges expired JWT tokens automatically", () => {
    // Construct expired JWT: {"exp": 1000} (expired in 1970)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const expiredPayload = btoa(JSON.stringify({ sub: "user-123", exp: 1000 }));
    const expiredJwt = `${header}.${expiredPayload}.mocksignature`;

    expect(isTokenExpired(expiredJwt)).toBe(true);

    // Setting expired token into ApiClient should be purged on retrieval
    ApiClient.setToken(expiredJwt);
    expect(ApiClient.getToken()).toBeNull();
    expect(ApiClient.isAuthenticated()).toBe(false);

    // Valid future token: {"exp": futureTimestamp}
    const futurePayload = btoa(JSON.stringify({ sub: "user-123", exp: Math.floor(Date.now() / 1000) + 3600 }));
    const validJwt = `${header}.${futurePayload}.mocksignature`;
    expect(isTokenExpired(validJwt)).toBe(false);

    ApiClient.setToken(validJwt);
    expect(ApiClient.getToken()).toBe(validJwt);
    expect(ApiClient.isAuthenticated()).toBe(true);
  });

  it("never persists plaintext passwords in localStorage during signup/login", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network Error (Server Offline)"));

    const secretPassword = "SuperSecretClinicianPassword99!";
    await authService.signup({
      email: "new.doctor@hospital.org",
      password: secretPassword,
      full_name: "Dr. Alex Rivera",
      hospital_name: "Metro Vision Hospital",
    });

    // Check all values in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key || "");
      expect(val).not.toContain(secretPassword);
    }
  });

  it("dispatches changePassword request with proper payload", async () => {
    const postSpy = vi.spyOn(ApiClient, "post").mockResolvedValue({ message: "Password updated successfully." });

    await authService.changePassword("OldPassword123!", "NewPassword456!");

    expect(postSpy).toHaveBeenCalledWith("/auth/change-password", {
      current_password: "OldPassword123!",
      new_password: "NewPassword456!",
    });
  });
});
