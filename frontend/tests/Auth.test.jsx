import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../src/firebase";
import Auth from "../src/components/Auth";

// Mock Firebase authentication methods
jest.mock("firebase/auth", () => {
    const actualAuth = jest.requireActual("firebase/auth");
    return {
      ...actualAuth,
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signInWithPopup: jest.fn(),
      GoogleAuthProvider: jest.fn(() => new actualAuth.GoogleAuthProvider()), // Properly instantiate
    };
  });

beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
});
  

jest.mock("../src/firebase", () => ({
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(() => ({})), // Mock collection reference
  addDoc: jest.fn(),
}));


describe("Auth Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders sign-in form by default", () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    const signInButtons = screen.getAllByRole("button", { name: /sign in/i });
    fireEvent.click(signInButtons[0]); // Or choose the correct index

  });

  test("switches to sign-up form when clicking 'Sign Up'", () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));

    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone Number")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Vehicle Number (e.g., ABC-123)")).toBeInTheDocument();
  });

  test("allows users to type in email and password fields", () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  test("submits sign-in form successfully", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "12345" } });

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    // Use getAllByRole to select the right button
    const buttons = screen.getAllByRole("button", { name: /sign in/i });

    // Choose the correct one based on index or attributes
    fireEvent.click(buttons[1]); // Assuming the second button is the submit button


    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "test@example.com", "password123"));
  });

  test("submits sign-up form successfully", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "67890" } });

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));

    fireEvent.change(screen.getByPlaceholderText("Full Name"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "newuser@example.com", "password123"));
  });

  test("handles Google sign-in", async () => {
    signInWithPopup.mockResolvedValue({ user: { uid: "google-user-123" } });

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => expect(signInWithPopup).toHaveBeenCalledWith(auth,
        expect.objectContaining({
          providerId: "google.com",
          scopes: expect.arrayContaining(["profile"]),
        })));
  });
});
