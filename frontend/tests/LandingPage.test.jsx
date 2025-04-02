import React from "react";  // ✅ Ensure React is imported
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "../src/components/LandingPage";
import { auth } from "../src/firebase";  // ✅ Mock auth properly
import "@testing-library/jest-dom";


// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock the SVG import
jest.mock("../src/assets/batmanlogosvg.svg", () => "mocked-svg");
jest.mock("../src/firebase", () => require("frontend/tests/__mocks__/firebase.js"));

describe("LandingPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  test("navigates to login when 'Enter the Batcave' is clicked (unauthenticated)", async () => {
    // Ensure user is NOT authenticated
    auth.currentUser = null;

    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );
    });

    const enterButton = screen.getByText("Enter the Batcave");
    fireEvent.click(enterButton);

    // Assert navigation was called with "/login"
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("navigates to dashboard when 'Enter the Batcave' is clicked (authenticated)", async () => {
    // Ensure user is authenticated
    auth.currentUser = { uid: "12345" };

    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );
    });

    const enterButton = screen.getByText("Enter the Batcave");
    fireEvent.click(enterButton);

    // Assert navigation was called with "/dashboard"
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
