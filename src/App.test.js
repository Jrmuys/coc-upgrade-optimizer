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

    // Strategy selector hidden (CP-SAT is primary, strategy only used as fallback)
    const strategySelect = screen.queryByRole('combobox', {
        name: /optimization strategy/i,
    });
    expect(strategySelect).not.toBeInTheDocument();

    expect(
        screen.getByRole('button', { name: /reset settings/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /reset progress/i }),
    ).toBeInTheDocument();
});
