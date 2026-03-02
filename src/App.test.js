import { render, screen } from '@testing-library/react';

jest.mock('./BuilderTimeline.jsx', () => () => null);

import App from './App';

test('renders smart village tracker title', () => {
    render(<App />);
    const headingElement = screen.getByText(/coc upgrade tracker/i);
    expect(headingElement).toBeInTheDocument();
});

test('renders phase controls for strategy and reset actions', () => {
    render(<App />);

    expect(screen.getByText(/schedule generator/i)).toBeInTheDocument();

    // Check for strategy dropdown (Phase 8 multi-objective optimization)
    const strategySelect = screen.getByRole('combobox', {
        name: /optimization strategy/i,
    });
    expect(strategySelect).toBeInTheDocument();

    // Verify options include legacy LPT/SPT and new profiles
    expect(screen.getByText(/longest processing time/i)).toBeInTheDocument();
    expect(screen.getByText(/shortest processing time/i)).toBeInTheDocument();

    expect(
        screen.getByRole('button', { name: /reset settings/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /reset progress/i }),
    ).toBeInTheDocument();
});
