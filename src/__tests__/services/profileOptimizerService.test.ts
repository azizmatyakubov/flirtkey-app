/**
 * Tests for Profile Optimizer Service
 */

import {
  analyzeProfile,
  getScoreColor,
  getScoreLabel,
} from '../../services/profileOptimizerService';

describe('ProfileOptimizerService', () => {
  describe('analyzeProfile', () => {
    it('should return a valid ProfileReview', () => {
      const review = analyzeProfile();
      expect(review.id).toBeTruthy();
      expect(review.timestamp).toBeGreaterThan(0);
      expect(review.score).toBeDefined();
      expect(review.suggestions.length).toBeGreaterThan(0);
      expect(review.photoSuggestions.length).toBe(6);
      expect(review.bioFeedback).toBeTruthy();
      expect(review.overallFeedback).toBeTruthy();
    });

    it('should return overall score between 1 and 100', () => {
      const review = analyzeProfile();
      expect(review.score.overall).toBeGreaterThanOrEqual(1);
      expect(review.score.overall).toBeLessThanOrEqual(100);
    });

    it('should return breakdown scores between 0 and 100', () => {
      const review = analyzeProfile();
      expect(review.score.bioQuality).toBeGreaterThanOrEqual(0);
      expect(review.score.bioQuality).toBeLessThanOrEqual(100);
      expect(review.score.photoVariety).toBeGreaterThanOrEqual(0);
      expect(review.score.photoVariety).toBeLessThanOrEqual(100);
      expect(review.score.conversationStarters).toBeGreaterThanOrEqual(0);
      expect(review.score.conversationStarters).toBeLessThanOrEqual(100);
      expect(review.score.overallAppeal).toBeGreaterThanOrEqual(0);
      expect(review.score.overallAppeal).toBeLessThanOrEqual(100);
    });

    it('should give lower bio score when no bio', () => {
      const noBio = analyzeProfile({ hasBio: false });
      const withBio = analyzeProfile({ hasBio: true, bioLength: 100 });
      expect(noBio.score.bioQuality).toBeLessThan(withBio.score.bioQuality);
    });

    it('should give lower photo score with fewer photos', () => {
      const fewPhotos = analyzeProfile({ photoCount: 1 });
      const manyPhotos = analyzeProfile({ photoCount: 5 });
      expect(fewPhotos.score.photoVariety).toBeLessThan(manyPhotos.score.photoVariety);
    });

    it('should give lower prompt score without prompts', () => {
      const noPrompts = analyzeProfile({ hasPrompts: false });
      const withPrompts = analyzeProfile({ hasPrompts: true });
      expect(noPrompts.score.conversationStarters).toBeLessThan(
        withPrompts.score.conversationStarters
      );
    });

    it('should include photo suggestions', () => {
      const review = analyzeProfile();
      review.photoSuggestions.forEach((ps) => {
        expect(ps.type).toBeTruthy();
        expect(ps.label).toBeTruthy();
        expect(ps.description).toBeTruthy();
        expect(ps.icon).toBeTruthy();
        expect(typeof ps.hasIt).toBe('boolean');
      });
    });

    it('should provide suggestions with required fields', () => {
      const review = analyzeProfile();
      review.suggestions.forEach((s) => {
        expect(s.id).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.description).toBeTruthy();
        expect(s.icon).toBeTruthy();
        expect(['bio', 'photos', 'prompts', 'general']).toContain(s.category);
        expect(['high', 'medium', 'low']).toContain(s.priority);
      });
    });
  });

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getScoreColor(85)).toBe('#2ED573');
    });

    it('should return yellow for medium scores', () => {
      expect(getScoreColor(65)).toBe('#FFBE76');
    });

    it('should return orange for low-medium scores', () => {
      expect(getScoreColor(45)).toBe('#FF8E53');
    });

    it('should return red for low scores', () => {
      expect(getScoreColor(25)).toBe('#FF4757');
    });
  });

  describe('getScoreLabel', () => {
    it('should return descriptive labels', () => {
      expect(getScoreLabel(95)).toBe('Outstanding');
      expect(getScoreLabel(85)).toBe('Great');
      expect(getScoreLabel(75)).toBe('Good');
      expect(getScoreLabel(65)).toBe('Decent');
      expect(getScoreLabel(45)).toBe('Needs Work');
      expect(getScoreLabel(20)).toBe('Critical');
    });
  });
});
