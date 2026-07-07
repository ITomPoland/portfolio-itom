// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { analyticsMock } = vi.hoisted(() => ({
    analyticsMock: {
        analyticsEnabled: vi.fn(),
        getConsent: vi.fn(),
        grantConsent: vi.fn(),
        denyConsent: vi.fn(),
    },
}));

vi.mock('../../../utils/analytics', () => analyticsMock);

import ConsentBanner from '../ConsentBanner.jsx';

describe('ConsentBanner', () => {
    beforeEach(() => {
        analyticsMock.analyticsEnabled.mockReset();
        analyticsMock.getConsent.mockReset();
        analyticsMock.grantConsent.mockReset();
        analyticsMock.denyConsent.mockReset();
    });

    it('renders when analytics is enabled and no consent choice is stored', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(true);
        analyticsMock.getConsent.mockReturnValue(null);
        render(<ConsentBanner />);
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('does not render when analytics is disabled', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(false);
        analyticsMock.getConsent.mockReturnValue(null);
        render(<ConsentBanner />);
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('does not re-render when a choice is already stored ("granted")', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(true);
        analyticsMock.getConsent.mockReturnValue('granted');
        render(<ConsentBanner />);
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('does not re-render when a choice is already stored ("denied")', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(true);
        analyticsMock.getConsent.mockReturnValue('denied');
        render(<ConsentBanner />);
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('clicking Accepter calls grantConsent once, never denyConsent, and hides the banner', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(true);
        analyticsMock.getConsent.mockReturnValue(null);
        render(<ConsentBanner />);

        fireEvent.click(screen.getByText('Accepter'));

        expect(analyticsMock.grantConsent).toHaveBeenCalledTimes(1);
        expect(analyticsMock.denyConsent).not.toHaveBeenCalled();
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('clicking Refuser calls denyConsent once, never grantConsent, and hides the banner', () => {
        analyticsMock.analyticsEnabled.mockReturnValue(true);
        analyticsMock.getConsent.mockReturnValue(null);
        render(<ConsentBanner />);

        fireEvent.click(screen.getByText('Refuser'));

        expect(analyticsMock.denyConsent).toHaveBeenCalledTimes(1);
        expect(analyticsMock.grantConsent).not.toHaveBeenCalled();
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });
});
