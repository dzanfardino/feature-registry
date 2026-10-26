import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders the product name and navigation', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('Feature Registry')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Attributes' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument());
  });
});
