import React from "react";
import { render, screen, fireEvent,act } from "@testing-library/react";
import PaymentForm from "../src/components/PaymentForm";
import { MemoryRouter } from "react-router-dom";

jest.mock("../src/firebase", () => ({
  auth: {},
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
// Mock the props
const mockProps = {
  totalAmount: 100,
  discount: 10,
  onPayment: jest.fn(),
};

describe("PaymentForm Component", () => {
  /*
  test("renders payment form with correct total", () => {
    render(<MemoryRouter><PaymentForm onPayment={mockProps.onPayment} /></MemoryRouter>);
    expect(screen.getByText("Total Amount: $100.00")).toBeInTheDocument();
    expect(screen.getByText("Discount: $10.00")).toBeInTheDocument();
    expect(screen.getByText("Final Amount: $90.00")).toBeInTheDocument();
  });
*/
  test("allows user to enter payment details", () => {
    render(<MemoryRouter><PaymentForm onPayment={mockProps.onPayment} /></MemoryRouter>);
    
    const cardNumberInput = screen.getByLabelText(/Card Number/i);
    fireEvent.change(cardNumberInput, { target: { value: "4111111111111111" } });
    expect(cardNumberInput.value).toBe("4111 1111 1111 1111");
  });
/*
  test("validates empty form submission", () => {
    render(<MemoryRouter><PaymentForm onPayment={mockProps.onPayment} /></MemoryRouter>);
    
    fireEvent.click(screen.getByText(/Pay Now/i));
    
    expect(screen.getByText(/Card number must be exactly 16 digits./i)).toBeInTheDocument();
  });
*/
test("triggers onPayment when valid details are submitted", async () => {
  const mockOnPayment = jest.fn();

  render(
    <MemoryRouter>
      <PaymentForm onPayment={mockProps.onPayment} />
    </MemoryRouter>
  );

  // Fill in required fields
  fireEvent.change(screen.getByLabelText(/Card Number/i), { target: { value: "4111111111111111" } });
  fireEvent.change(screen.getByLabelText(/Expiry Date/i), { target: { value: "2025-12" } });
  fireEvent.change(screen.getByLabelText(/CVV/i), { target: { value: "123" } });
  fireEvent.change(screen.getByLabelText(/Cardholder Name/i), { target: { value: "John Doe" } });

  // Submit form
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
  });

  
});
});
