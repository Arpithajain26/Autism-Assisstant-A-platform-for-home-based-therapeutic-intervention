import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login";

// Mock the API service
vi.mock("../services/api", () => ({
  loginUser: vi.fn(),
}));

import { loginUser } from "../services/api";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.location
const locationMock = {
  pathname: "/",
  replace: vi.fn(),
  href: "",
};
Object.defineProperty(window, "location", {
  value: locationMock,
  writable: true,
});

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem.mockClear();
    locationMock.href = "";
  });

  it("renders login form with email and password fields", () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state during login", async () => {
    loginUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100)),
    );

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/signing in/i);
  });

  it("handles successful login", async () => {
    const mockUserData = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    loginUser.mockResolvedValue(mockUserData);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith("test@example.com", "password123");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token",
        "fake-token",
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user_name",
        "Test User",
      );
      expect(locationMock.href).toBe("/dashboard");
    });
  });

  it("shows error message on login failure", async () => {
    loginUser.mockResolvedValue(null);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "⚠️ Login failed. Please check your credentials and try again.",
        ),
      ).toBeInTheDocument();
    });
  });
});
