/**
 * Tests for Template Service
 */

import {
  TEMPLATES,
  CATEGORIES,
  TemplateCategory,
  getTemplatesByCategory,
  searchTemplates,
  getMostUsedTemplates,
  customizeTemplate,
  getCategoryInfo,
} from '../../services/templateService';

describe('TemplateService', () => {
  describe('TEMPLATES', () => {
    it('should have at least 60 templates', () => {
      expect(TEMPLATES.length).toBeGreaterThanOrEqual(60);
    });

    it('should have unique IDs', () => {
      const ids = TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each template has required fields', () => {
      TEMPLATES.forEach((t) => {
        expect(t.id).toBeTruthy();
        expect(t.text).toBeTruthy();
        expect(t.tags.length).toBeGreaterThan(0);
        expect(typeof t.copyCount).toBe('number');
      });
    });

    it('should have at least 10 templates per category', () => {
      const categories: TemplateCategory[] = [
        'first_message',
        'comeback',
        'flirty',
        'funny',
        'deep',
        'closing',
      ];
      categories.forEach((cat) => {
        const count = TEMPLATES.filter((t) => t.category === cat).length;
        expect(count).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('CATEGORIES', () => {
    it('should have 6 categories', () => {
      expect(CATEGORIES.length).toBe(6);
    });

    it('each category has required fields', () => {
      CATEGORIES.forEach((c) => {
        expect(c.key).toBeTruthy();
        expect(c.label).toBeTruthy();
        expect(c.emoji).toBeTruthy();
        expect(c.color).toMatch(/^#/);
        expect(c.description).toBeTruthy();
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for a category', () => {
      const result = getTemplatesByCategory('first_message');
      expect(result.length).toBeGreaterThan(0);
      result.forEach((t) => expect(t.category).toBe('first_message'));
    });

    it('should not include other categories', () => {
      const result = getTemplatesByCategory('flirty');
      result.forEach((t) => expect(t.category).toBe('flirty'));
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by text', () => {
      const result = searchTemplates('coffee');
      expect(result.length).toBeGreaterThan(0);
      result.forEach((t) => {
        const matches =
          t.text.toLowerCase().includes('coffee') || t.tags.some((tag) => tag.includes('coffee'));
        expect(matches).toBe(true);
      });
    });

    it('should find templates by tag', () => {
      const result = searchTemplates('confident');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return all templates for empty query', () => {
      const result = searchTemplates('');
      expect(result.length).toBe(TEMPLATES.length);
    });

    it('should return empty for no match', () => {
      const result = searchTemplates('xyznonexistent123');
      expect(result.length).toBe(0);
    });
  });

  describe('getMostUsedTemplates', () => {
    it('should return templates sorted by copy count', () => {
      const stats = [
        { templateId: 'fm_1', copyCount: 5, lastUsed: Date.now() },
        { templateId: 'fm_3', copyCount: 10, lastUsed: Date.now() },
        { templateId: 'fl_1', copyCount: 2, lastUsed: Date.now() },
      ];
      const result = getMostUsedTemplates(stats);
      expect(result.length).toBe(3);
      expect(result[0]!.id).toBe('fm_3');
      expect(result[1]!.id).toBe('fm_1');
      expect(result[2]!.id).toBe('fl_1');
    });

    it('should exclude templates with 0 copies', () => {
      const result = getMostUsedTemplates([]);
      expect(result.length).toBe(0);
    });
  });

  describe('customizeTemplate', () => {
    it('should replace blanks with values', () => {
      const template = TEMPLATES.find((t) => t.blanks && t.blanks.length > 0)!;
      expect(template).toBeDefined();
      const blank = template.blanks![0]!;
      const result = customizeTemplate(template, { [blank]: 'hiking' });
      expect(result).not.toContain(blank);
      expect(result).toContain('hiking');
    });

    it('should leave text unchanged if no blanks', () => {
      const template = TEMPLATES.find((t) => !t.blanks || t.blanks.length === 0)!;
      const result = customizeTemplate(template, {});
      expect(result).toBe(template.text);
    });
  });

  describe('getCategoryInfo', () => {
    it('should return info for all categories', () => {
      const cats: TemplateCategory[] = [
        'first_message',
        'comeback',
        'flirty',
        'funny',
        'deep',
        'closing',
      ];
      cats.forEach((c) => {
        const info = getCategoryInfo(c);
        expect(info).toBeDefined();
        expect(info.key).toBe(c);
        expect(info.label).toBeTruthy();
      });
    });
  });
});
