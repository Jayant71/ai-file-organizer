/**
 * Rule Engine Tests
 * Unit tests for the rule engine conditions and actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine, matchCondition, matchAllConditions } from '../src/domain/rule-engine';
import { applyAction, generateMovePath, generateDateBasedPath } from '../src/domain/rule-engine/actions';
import { FileMeta } from '../src/domain/types/file';
import { Rule, Condition } from '../src/domain/types/rule';

// Mock file for testing
const createMockFile = (overrides: Partial<FileMeta> = {}): FileMeta => ({
  id: 'test-1',
  path: '/home/user/Downloads/document.pdf',
  name: 'document.pdf',
  extension: '.pdf',
  size: 1024 * 100, // 100 KB
  createdTime: new Date('2024-01-01'),
  modifiedTime: new Date('2024-06-15'),
  mimeType: 'application/pdf',
  isDirectory: false,
  source: 'local',
  parentPath: '/home/user/Downloads',
  ...overrides,
});

describe('Condition Matchers', () => {
  describe('matchCondition - extension', () => {
    it('should match extension with equals operator', () => {
      const file = createMockFile({ extension: '.pdf' });
      const condition: Condition = {
        id: 'c1',
        type: 'extension',
        operator: 'equals',
        value: '.pdf',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should match extension with in operator', () => {
      const file = createMockFile({ extension: '.pdf' });
      const condition: Condition = {
        id: 'c1',
        type: 'extension',
        operator: 'in',
        value: ['.pdf', '.docx', '.txt'],
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should not match extension with notIn operator when in list', () => {
      const file = createMockFile({ extension: '.pdf' });
      const condition: Condition = {
        id: 'c1',
        type: 'extension',
        operator: 'notIn',
        value: ['.pdf', '.docx'],
      };
      expect(matchCondition(file, condition)).toBe(false);
    });

    it('should be case insensitive', () => {
      const file = createMockFile({ extension: '.PDF' });
      const condition: Condition = {
        id: 'c1',
        type: 'extension',
        operator: 'equals',
        value: '.pdf',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });
  });

  describe('matchCondition - category', () => {
    it('should match documents category', () => {
      const file = createMockFile({ extension: '.pdf' });
      const condition: Condition = {
        id: 'c1',
        type: 'category',
        operator: 'equals',
        value: 'documents',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should match images category', () => {
      const file = createMockFile({ extension: '.jpg' });
      const condition: Condition = {
        id: 'c1',
        type: 'category',
        operator: 'equals',
        value: 'images',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should match code category', () => {
      const file = createMockFile({ extension: '.ts' });
      const condition: Condition = {
        id: 'c1',
        type: 'category',
        operator: 'equals',
        value: 'code',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });
  });

  describe('matchCondition - size', () => {
    it('should match size greater than', () => {
      const file = createMockFile({ size: 1024 * 500 }); // 500 KB
      const condition: Condition = {
        id: 'c1',
        type: 'size',
        operator: 'gt',
        value: 1024 * 100, // 100 KB
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should match size less than', () => {
      const file = createMockFile({ size: 1024 * 50 }); // 50 KB
      const condition: Condition = {
        id: 'c1',
        type: 'size',
        operator: 'lt',
        value: 1024 * 100, // 100 KB
      };
      expect(matchCondition(file, condition)).toBe(true);
    });
  });

  describe('matchCondition - name', () => {
    it('should match name contains', () => {
      const file = createMockFile({ name: 'invoice_2024_01.pdf' });
      const condition: Condition = {
        id: 'c1',
        type: 'name',
        operator: 'contains',
        value: 'invoice',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });

    it('should match name startsWith', () => {
      const file = createMockFile({ name: 'screenshot_2024.png' });
      const condition: Condition = {
        id: 'c1',
        type: 'name',
        operator: 'startsWith',
        value: 'screenshot',
      };
      expect(matchCondition(file, condition)).toBe(true);
    });
  });

  describe('matchAllConditions', () => {
    it('should return true when all conditions match', () => {
      const file = createMockFile({ 
        extension: '.pdf', 
        size: 1024 * 200 
      });
      const conditions: Condition[] = [
        { id: 'c1', type: 'category', operator: 'equals', value: 'documents' },
        { id: 'c2', type: 'size', operator: 'gt', value: 1024 * 100 },
      ];
      expect(matchAllConditions(file, conditions)).toBe(true);
    });

    it('should return false when any condition fails', () => {
      const file = createMockFile({ 
        extension: '.pdf', 
        size: 1024 * 50 
      });
      const conditions: Condition[] = [
        { id: 'c1', type: 'category', operator: 'equals', value: 'documents' },
        { id: 'c2', type: 'size', operator: 'gt', value: 1024 * 100 },
      ];
      expect(matchAllConditions(file, conditions)).toBe(false);
    });

    it('should return true for empty conditions', () => {
      const file = createMockFile();
      expect(matchAllConditions(file, [])).toBe(true);
    });
  });
});

describe('Action Generators', () => {
  describe('generateMovePath', () => {
    it('should generate move path with absolute target', () => {
      const file = createMockFile();
      const params = { targetFolder: '/home/user/Documents' };
      const result = generateMovePath(file, params);
      expect(result).toContain('Documents');
      expect(result).toContain('document.pdf');
    });

    it('should generate move path with relative target', () => {
      const file = createMockFile({ parentPath: '/home/user/Downloads' });
      const params = { targetFolder: 'Organized' };
      const result = generateMovePath(file, params, '/home/user');
      expect(result).toContain('Organized');
      expect(result).toContain('document.pdf');
    });
  });

  describe('generateDateBasedPath', () => {
    it('should generate date-based path', () => {
      const file = createMockFile({
        modifiedTime: new Date('2024-06-15'),
      });
      const params = { 
        targetFolder: 'Archive',
        dateFormat: 'YYYY/MM',
      };
      const result = generateDateBasedPath(file, params, '/home/user');
      expect(result).toContain('Archive');
      expect(result).toContain('2024');
      expect(result).toContain('06');
    });
  });
});

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  it('should evaluate file against rules', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Move PDFs',
        description: 'Move PDF files to Documents',
        conditions: [
          { id: 'c1', type: 'extension', operator: 'equals', value: '.pdf' },
        ],
        actions: [
          { id: 'a1', type: 'move', params: { targetFolder: 'Documents' } },
        ],
        scope: 'local',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    engine.setRules(rules);
    const file = createMockFile({ extension: '.pdf' });
    const result = engine.evaluateFile(file, { scope: 'local' });

    expect(result.matched).toBe(true);
    expect(result.matchedRule?.name).toBe('Move PDFs');
    expect(result.proposedChange).toBeDefined();
  });

  it('should skip disabled rules', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Move PDFs',
        description: 'Move PDF files to Documents',
        conditions: [
          { id: 'c1', type: 'extension', operator: 'equals', value: '.pdf' },
        ],
        actions: [
          { id: 'a1', type: 'move', params: { targetFolder: 'Documents' } },
        ],
        scope: 'local',
        enabled: false,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    engine.setRules(rules);
    const file = createMockFile({ extension: '.pdf' });
    const result = engine.evaluateFile(file, { scope: 'local' });

    expect(result.matched).toBe(false);
  });

  it('should filter rules by scope', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Local Only Rule',
        description: '',
        conditions: [
          { id: 'c1', type: 'extension', operator: 'equals', value: '.pdf' },
        ],
        actions: [
          { id: 'a1', type: 'move', params: { targetFolder: 'Documents' } },
        ],
        scope: 'local',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    engine.setRules(rules);
    const file = createMockFile({ extension: '.pdf' });
    
    // Should match local scope
    const localResult = engine.evaluateFile(file, { scope: 'local' });
    expect(localResult.matched).toBe(true);

    // Should not match drive scope
    const driveResult = engine.evaluateFile(file, { scope: 'drive' });
    expect(driveResult.matched).toBe(false);
  });

  it('should batch evaluate multiple files', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Move Documents',
        description: '',
        conditions: [
          { id: 'c1', type: 'category', operator: 'equals', value: 'documents' },
        ],
        actions: [
          { id: 'a1', type: 'move', params: { targetFolder: 'Documents' } },
        ],
        scope: 'local',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    engine.setRules(rules);
    
    const files = [
      createMockFile({ id: '1', extension: '.pdf' }),
      createMockFile({ id: '2', extension: '.jpg' }),
      createMockFile({ id: '3', extension: '.docx' }),
    ];

    const result = engine.evaluateFiles(files, { scope: 'local' });

    expect(result.totalFiles).toBe(3);
    expect(result.matchedFiles).toBe(2); // .pdf and .docx are documents
    expect(result.changes.length).toBe(2);
    expect(result.unmatched.length).toBe(1); // .jpg is images
  });
});
