import { describe, it, expect, beforeEach, vi } from "vitest";
import { authService } from "@/services/auth.service";
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
});
