// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminApp from '../../admin/AdminApp.jsx';

describe('AdminApp login', () => {
    it('renders token login form without echoing secrets', () => {
        render(<AdminApp />);
        expect(screen.getByLabelText(/jeton/i)).toHaveAttribute('type', 'password');
        expect(screen.getByRole('heading', { name: /back-office/i })).toBeInTheDocument();
    });
});
