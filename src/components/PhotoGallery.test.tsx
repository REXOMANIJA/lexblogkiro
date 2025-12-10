import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PhotoGallery } from './PhotoGallery';

describe('PhotoGallery Carousel', () => {
  it('displays single photo without navigation arrows', () => {
    const photos = ['https://example.com/photo1.jpg'];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    // Should not have navigation arrows for single photo
    expect(screen.queryByTestId('nav-arrow-prev')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-arrow-next')).not.toBeInTheDocument();
  });

  it('displays navigation arrows for multiple photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    // Should have navigation arrows for multiple photos
    expect(screen.getByTestId('nav-arrow-prev')).toBeInTheDocument();
    expect(screen.getByTestId('nav-arrow-next')).toBeInTheDocument();
  });

  it('displays center photo prominently with adjacent photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    // Should have center photo
    expect(screen.getByTestId('center-photo')).toBeInTheDocument();
    
    // Should have adjacent photos (scaled and blurred)
    expect(screen.getByTestId('adjacent-photo-left')).toBeInTheDocument();
    expect(screen.getByTestId('adjacent-photo-right')).toBeInTheDocument();
  });

  it('navigates to next photo when next button is clicked', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    const centerPhoto = screen.getByTestId('center-photo');
    const initialSrc = centerPhoto.querySelector('img')?.src;
    
    // Click next button
    const nextButton = screen.getByTestId('nav-arrow-next');
    fireEvent.click(nextButton);
    
    // Center photo should change
    const newSrc = centerPhoto.querySelector('img')?.src;
    expect(newSrc).not.toBe(initialSrc);
  });

  it('navigates to previous photo when previous button is clicked', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    const centerPhoto = screen.getByTestId('center-photo');
    const initialSrc = centerPhoto.querySelector('img')?.src;
    
    // Click previous button
    const prevButton = screen.getByTestId('nav-arrow-prev');
    fireEvent.click(prevButton);
    
    // Center photo should change
    const newSrc = centerPhoto.querySelector('img')?.src;
    expect(newSrc).not.toBe(initialSrc);
  });

  it('displays photo counter for multiple photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    // Should show counter
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('handles two photos correctly', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ];
    render(<PhotoGallery photos={photos} alt="Test" />);
    
    // Should have navigation arrows
    expect(screen.getByTestId('nav-arrow-prev')).toBeInTheDocument();
    expect(screen.getByTestId('nav-arrow-next')).toBeInTheDocument();
    
    // Should have center photo and adjacent photos
    expect(screen.getByTestId('center-photo')).toBeInTheDocument();
    expect(screen.getByTestId('adjacent-photo-left')).toBeInTheDocument();
    expect(screen.getByTestId('adjacent-photo-right')).toBeInTheDocument();
  });
});
