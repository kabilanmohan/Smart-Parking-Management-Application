import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaymentForm from "../src/components/PaymentForm";
import { db } from "../src/firebase";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";

jest.mock("../src/firebase", () => ({
  db: {},
}));

beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  addDoc: jest.fn(),
}));

describe("PaymentForm Component", () => {
  const mockOnPaymentSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders PaymentForm correctly", () => {
    render(<PaymentForm onPaymentSuccess={mockOnPaymentSuccess} />);
    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1234 5678 9012 3456")).toBeInTheDocument();
  });

  test("applies discount when valid code is entered", async () => {
    getDocs.mockResolvedValue({ empty: false, docs: [{ data: () => ({ discount: 10 }) }] });
    render(<PaymentForm onPaymentSuccess={mockOnPaymentSuccess} />);
    const discountInput = screen.getByPlaceholderText("DISCOUNT50");
    fireEvent.change(discountInput, { target: { value: "DISCOUNT10" } });
    fireEvent.click(screen.getByText("Apply"));
    await waitFor(() => expect(screen.getByText("$45.00")).toBeInTheDocument());
  });

  test("handles successful payment", async () => {
    addDoc.mockResolvedValueOnce({});
    render(<PaymentForm onPaymentSuccess={mockOnPaymentSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("1234 5678 9012 3456"), { target: { value: "4111 1111 1111 1111" } });
    fireEvent.change(screen.getByLabelText("Expiry Date 📅"), { target: { value: "2025-12" } });
    fireEvent.change(screen.getByPlaceholderText("123"), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText("Alice Bob"), { target: { value: "John Doe" } });
    fireEvent.click(screen.getByText("Pay Now"));
    await waitFor(() => expect(mockOnPaymentSuccess).toHaveBeenCalled());
  });

  test("displays error on failed payment", async () => {
    addDoc.mockRejectedValue(new Error("Payment failed"));
    render(<PaymentForm onPaymentSuccess={mockOnPaymentSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("1234 5678 9012 3456"), { target: { value: "4111 1111 1111 1111" } });
    fireEvent.change(screen.getByLabelText("Expiry Date 📅"), { target: { value: "2025-12" } });
    fireEvent.change(screen.getByPlaceholderText("123"), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText("Alice Bob"), { target: { value: "John Doe" } });
    fireEvent.click(screen.getByText("Pay Now"));
    await waitFor(() => expect(screen.getByText("Payment failed. Please try again.")).toBeInTheDocument());
  });
});
