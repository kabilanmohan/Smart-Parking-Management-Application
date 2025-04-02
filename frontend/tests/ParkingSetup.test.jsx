import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ParkingSetup from "../src/components/ParkingSetup";

const mockNavigate = jest.fn();
const mockRemoveRequest = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: { requestId: "123", removeRequest: mockRemoveRequest },
    search: "?space=3x2&levels=2",
  }),
}));

describe("ParkingSetup Component", () => {
  test("renders correctly with levels and slots", () => {
    render(
      <MemoryRouter>
        <ParkingSetup />
      </MemoryRouter>
    );

    expect(screen.getByText("Setup Parking Lot - Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
  });

  test("switches levels when buttons are clicked", () => {
    render(
      <MemoryRouter>
        <ParkingSetup />
      </MemoryRouter>
    );

    const level2Button = screen.getByText("Level 2");
    fireEvent.click(level2Button);

    expect(screen.getByText("Setup Parking Lot - Level 2")).toBeInTheDocument();
  });

  test("toggles parking slot types when clicked", () => {
    render(
      <MemoryRouter>
        <ParkingSetup />
      </MemoryRouter>
    );
  
    const firstSlot = screen.getByTestId("parking-slot-0");
    
    fireEvent.click(firstSlot);
    expect(firstSlot).toHaveTextContent("CAR");
  
    fireEvent.click(firstSlot);
    expect(firstSlot).toHaveTextContent("BIKE");
  
    fireEvent.click(firstSlot);
    expect(firstSlot).toHaveTextContent("");
  });
  

  test("saves parking configuration and navigates to dashboard", () => {
    render(
      <MemoryRouter>
        <ParkingSetup />
      </MemoryRouter>
    );

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(mockRemoveRequest).toHaveBeenCalledWith("123");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("cancels and navigates to dashboard", () => {
    render(
      <MemoryRouter>
        <ParkingSetup />
      </MemoryRouter>
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
