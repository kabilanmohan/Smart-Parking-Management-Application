import React from "react";
import { render, screen } from "@testing-library/react";
import AdminProfile from "../src/components/AdminProfile";  // Adjust the import based on your folder structure
import "@testing-library/jest-dom";

// Mock StatsCard component to avoid testing unnecessary dependencies
jest.mock("../src/components/StatsCard", () => () => <div data-testid="stats-card">StatsCard</div>);
jest.mock("leaflet/dist/leaflet.css", () => {});

// Mock Leaflet Map
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }) => <div data-testid="circle-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

describe("AdminProfile Component", () => {
  test("renders the admin profile section correctly", () => {
    render(<AdminProfile />);

    // Check for admin name
    expect(screen.getByText("Bruce Wayne")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();

    // Check for total active bookings
    expect(screen.getByText("Total Active Bookings")).toBeInTheDocument();
    expect(screen.getByText("1,258")).toBeInTheDocument();

    // Check if the stats section renders
    expect(screen.getAllByTestId("stats-card").length).toBeGreaterThan(0);
  });

  test("renders the map and markers", () => {
    render(<AdminProfile />);

    // Check if the map container is present
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    
    // Check if the city markers are present
    expect(screen.getAllByTestId("circle-marker").length).toBe(3);
    expect(screen.getByText("🔥 Gotham City - Highest Demand")).toBeInTheDocument();
    expect(screen.getAllByText("Blüdhaven").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Metropolis").length).toBeGreaterThan(0);
  });

  test("renders the busiest areas table", () => {
    render(<AdminProfile />);

    // Check if the busiest areas title is present
    expect(screen.getByText("Busiest Areas")).toBeInTheDocument();

    // Check for table headers
    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();

    // Check for city names
    expect(screen.getByText("Gotham City")).toBeInTheDocument();
    expect(screen.getAllByText("Blüdhaven").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Metropolis").length).toBeGreaterThan(0);
  });

  test("renders the parking load correctly", () => {
    render(<AdminProfile />);

    expect(screen.getByText("Current Parking Load")).toBeInTheDocument();
    expect(screen.getByText("85% Capacity")).toBeInTheDocument();
    expect(screen.getByText("Live updates every minute")).toBeInTheDocument();
  });
});
