import { describe, test, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { PhotoGallery } from './PhotoGallery';

// Arbitrary generator for photo URLs - use simple, consistent URLs to avoid normalization issues
const arbitraryPhotoUrl = (): fc.Arbitrary<string> => {
  return fc.integer({ min: 1, max: 1000 }).map(n => `https://example.com/photo${n}.jpg`);
};

describe('PhotoGallery Property Tests', () => {
  // Feature: personal-blog, Property 24: Gallery displays center photo prominently
  // Validates: Requirements 12.1, 12.4
  test('Property 24: Gallery displays center photo prominently', () => {
    fc.assert(
      fc.property(
        // Generate arrays of 3 or more photos (as per requirement 12.1)
        fc.array(arbitraryPhotoUrl(), { minLength: 3, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // alt text
        (photos, alt) => {
          // Render the PhotoGallery component
          const { container, unmount } = render(
            <PhotoGallery photos={photos} alt={alt} />
          );

          // Verify center photo exists and is displayed prominently
          const centerPhoto = container.querySelector('[data-testid="center-photo"]');
          expect(centerPhoto).not.toBeNull();

          // Verify adjacent photos exist and are scaled/blurred
          const leftPhoto = container.querySelector('[data-testid="adjacent-photo-left"]');
          const rightPhoto = container.querySelector('[data-testid="adjacent-photo-right"]');
          
          expect(leftPhoto).not.toBeNull();
          expect(rightPhoto).not.toBeNull();

          // Verify adjacent photos have blur filter applied
          // Check that blur filter is applied (filter property should contain 'blur')
          expect(leftPhoto?.getAttribute('style')).toContain('blur');
          expect(rightPhoto?.getAttribute('style')).toContain('blur');

          // Verify adjacent photos have reduced opacity (0.4 as per implementation)
          expect(leftPhoto?.className).toContain('opacity-40');
          expect(rightPhoto?.className).toContain('opacity-40');

          // Verify adjacent photos are scaled down (scale-75 as per implementation)
          expect(leftPhoto?.className).toContain('scale-75');
          expect(rightPhoto?.className).toContain('scale-75');

          // Verify center photo is larger (has z-10 for prominence)
          expect(centerPhoto?.className).toContain('z-10');

          // Verify the center photo displays the first photo in the array (initial state)
          const centerImg = centerPhoto?.querySelector('img');
          expect(centerImg?.src).toBe(photos[0]);

          // Verify adjacent photos display the correct photos (wrapping at boundaries)
          const leftImg = leftPhoto?.querySelector('img');
          const rightImg = rightPhoto?.querySelector('img');
          
          // Left should show the last photo (wrapping from index 0)
          expect(leftImg?.src).toBe(photos[photos.length - 1]);
          // Right should show the second photo
          expect(rightImg?.src).toBe(photos[1]);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: personal-blog, Property 25: Gallery navigation updates active photo
  // Validates: Requirements 12.3
  test('Property 25: Gallery navigation updates active photo', () => {
    fc.assert(
      fc.property(
        // Generate arrays of 2 or more photos (navigation only exists for multiple photos)
        fc.array(arbitraryPhotoUrl(), { minLength: 2, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // alt text
        fc.integer({ min: 0, max: 20 }), // number of next clicks
        fc.integer({ min: 0, max: 20 }), // number of previous clicks
        (photos, alt, nextClicks, prevClicks) => {
          // Render the PhotoGallery component
          const { container, unmount } = render(
            <PhotoGallery photos={photos} alt={alt} />
          );

          const centerPhoto = container.querySelector('[data-testid="center-photo"]');
          const nextButton = container.querySelector('[data-testid="nav-arrow-next"]');
          const prevButton = container.querySelector('[data-testid="nav-arrow-prev"]');

          expect(centerPhoto).not.toBeNull();
          expect(nextButton).not.toBeNull();
          expect(prevButton).not.toBeNull();

          // Initial state: should display first photo
          let centerImg = centerPhoto?.querySelector('img');
          expect(centerImg?.src).toBe(photos[0]);

          // Calculate expected index after next clicks
          let expectedIndex = nextClicks % photos.length;

          // Click next button multiple times
          for (let i = 0; i < nextClicks; i++) {
            fireEvent.click(nextButton as Element);
          }

          // Verify the center photo updated correctly
          centerImg = centerPhoto?.querySelector('img');
          expect(centerImg?.src).toBe(photos[expectedIndex]);

          // Now click previous button and verify wrapping
          expectedIndex = (expectedIndex - prevClicks % photos.length + photos.length) % photos.length;

          for (let i = 0; i < prevClicks; i++) {
            fireEvent.click(prevButton as Element);
          }

          // Verify the center photo updated correctly after previous clicks
          centerImg = centerPhoto?.querySelector('img');
          expect(centerImg?.src).toBe(photos[expectedIndex]);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: personal-blog, Property 26: Navigation arrows shown only for multiple photos
  // Validates: Requirements 12.2
  test('Property 26: Navigation arrows shown only for multiple photos', () => {
    fc.assert(
      fc.property(
        // Generate arrays of varying lengths (0 to 10 photos)
        fc.array(arbitraryPhotoUrl(), { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // alt text
        (photos, alt) => {
          // Render the PhotoGallery component
          const { container, unmount } = render(
            <PhotoGallery photos={photos} alt={alt} />
          );

          const nextButton = container.querySelector('[data-testid="nav-arrow-next"]');
          const prevButton = container.querySelector('[data-testid="nav-arrow-prev"]');

          if (photos.length > 1) {
            // For multiple photos, navigation arrows MUST be present
            expect(nextButton).not.toBeNull();
            expect(prevButton).not.toBeNull();
          } else {
            // For 0 or 1 photo, navigation arrows MUST NOT be present
            expect(nextButton).toBeNull();
            expect(prevButton).toBeNull();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
