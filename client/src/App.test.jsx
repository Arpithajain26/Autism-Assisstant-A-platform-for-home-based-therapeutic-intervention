import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

// Mock the page components
vi.mock("./pages/Login", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock("./pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock("./pages/Activities", () => ({
  default: () => <div data-testid="activities-page">Activities Page</div>,
}));

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

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    locationMock.pathname = "/";
    locationMock.href = "";
  });

  it("renders login page when not authenticated and on root path", () => {
    render(<App />);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders dashboard page when authenticated and on dashboard path", () => {
    localStorageMock.getItem.mockReturnValue("fake-token");
    locationMock.pathname = "/dashboard";

    render(<App />);
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("renders activities page when authenticated and on activities path", () => {
    localStorageMock.getItem.mockReturnValue("fake-token");
    locationMock.pathname = "/activities";

    render(<App />);
    expect(screen.getByTestId("activities-page")).toBeInTheDocument();
  });

  it("redirects to dashboard when authenticated and on root path", () => {
    localStorageMock.getItem.mockReturnValue("fake-token");
    locationMock.pathname = "/";

    render(<App />);
    expect(locationMock.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to login when not authenticated and on protected route", () => {
    localStorageMock.getItem.mockReturnValue(null);
    locationMock.pathname = "/dashboard";

    render(<App />);
    expect(locationMock.replace).toHaveBeenCalledWith("/");
  });
});
