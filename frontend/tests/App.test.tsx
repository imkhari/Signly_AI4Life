import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App routing', () => {
  it('renders home role select page with title', () => {
    render(<App />);
    expect(screen.getByText('AI4Care')).toBeInTheDocument();
    expect(screen.getByText('Màn hình Bệnh nhân')).toBeInTheDocument();
    expect(screen.getByText('Màn hình Điều dưỡng')).toBeInTheDocument();
  });
});

