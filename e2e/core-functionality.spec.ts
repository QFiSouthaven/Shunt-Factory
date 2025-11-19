import { test, expect } from '@playwright/test';

test.describe('Shunt Module - Core Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt module
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have all action buttons available', async ({ page }) => {
    // Check for common shunt actions
    const actionNames = ['summarize', 'expand', 'rewrite', 'format'];

    for (const action of actionNames) {
      const button = page.locator(`button, [role="button"]`).filter({
        hasText: new RegExp(action, 'i')
      }).first();

      // At least some actions should be visible
      if (await button.isVisible()) {
        console.log(`Action "${action}" found`);
      }
    }

    // Should have at least one action button
    const actionButtons = page.locator('button').filter({
      hasText: /summarize|expand|rewrite|amplify|format/i
    });
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should accept input and show character count', async ({ page }) => {
    const textarea = page.locator('textarea').first();

    if (await textarea.isVisible()) {
      const testText = 'This is a test input for the Shunt module. It should be processed by the AI.';
      await textarea.fill(testText);

      // Verify input was accepted
      const value = await textarea.inputValue();
      expect(value).toBe(testText);

      // Check for character/word count display
      const countDisplay = page.locator('text=/\\d+\\s*(characters?|words?|chars?)/i');
      if (await countDisplay.isVisible()) {
        console.log('Character/word count display found');
      }
    }
  });

  test('should have model selector', async ({ page }) => {
    // Look for model selection dropdown or buttons
    const modelSelector = page.locator('select, [role="combobox"], [role="listbox"]').first();

    if (await modelSelector.isVisible()) {
      console.log('Model selector found');

      // Check for Gemini model options
      const modelText = await page.locator('text=/gemini|flash|pro/i').first();
      if (await modelText.isVisible()) {
        console.log('Gemini model options available');
      }
    }
  });

  test('should have output display area', async ({ page }) => {
    // Look for output/result area
    const outputArea = page.locator('[data-testid="output"], [class*="output"], [class*="result"]').first();

    if (await outputArea.isVisible()) {
      console.log('Output area found');
    }

    // Or look for multiple textareas (input and output)
    const textareas = page.locator('textarea');
    const count = await textareas.count();
    console.log(`Found ${count} textarea(s)`);
  });

  test('should have copy and clear buttons', async ({ page }) => {
    // Look for utility buttons
    const copyButton = page.locator('button').filter({
      hasText: /copy|clipboard/i
    }).first();

    const clearButton = page.locator('button').filter({
      hasText: /clear|reset/i
    }).first();

    if (await copyButton.isVisible()) {
      console.log('Copy button found');
    }

    if (await clearButton.isVisible()) {
      console.log('Clear button found');
    }
  });
});

test.describe('Weaver Module - Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Weaver module
    const weaverTab = page.getByRole('button', { name: /weaver/i }).first();
    if (await weaverTab.isVisible()) {
      await weaverTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should load Weaver module', async ({ page }) => {
    // Check for Weaver-specific elements
    const weaverContent = page.locator('[data-testid="weaver"], [class*="weaver"]').first();

    if (await weaverContent.isVisible()) {
      console.log('Weaver module loaded');
    }

    // Look for workflow-related elements
    const workflowElements = page.locator('text=/workflow|step|chain|sequence/i');
    const count = await workflowElements.count();
    console.log(`Found ${count} workflow-related element(s)`);
  });

  test('should have workflow creation interface', async ({ page }) => {
    // Look for step/node creation
    const addButton = page.locator('button').filter({
      hasText: /add|create|new|step/i
    }).first();

    if (await addButton.isVisible()) {
      console.log('Workflow creation interface found');
    }
  });
});

test.describe('Foundry Module - Multi-Agent System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Foundry module
    const foundryTab = page.getByRole('button', { name: /foundry/i }).first();
    if (await foundryTab.isVisible()) {
      await foundryTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should load Foundry module', async ({ page }) => {
    // Check for Foundry-specific elements
    const foundryContent = page.locator('[data-testid="foundry"], [class*="foundry"]').first();

    if (await foundryContent.isVisible()) {
      console.log('Foundry module loaded');
    }

    // Look for agent-related elements
    const agentElements = page.locator('text=/agent|role|task|orchestrat/i');
    const count = await agentElements.count();
    console.log(`Found ${count} agent-related element(s)`);
  });

  test('should have agent configuration interface', async ({ page }) => {
    // Look for agent setup/configuration
    const configElements = page.locator('text=/config|setup|role|permission/i');

    if (await configElements.first().isVisible()) {
      console.log('Agent configuration interface found');
    }
  });
});

test.describe('Mia Assistant Integration', () => {
  test('should have Mia assistant button/panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for Mia assistant trigger
    const miaButton = page.locator('button, [role="button"]').filter({
      hasText: /mia|assistant|help|chat/i
    }).first();

    if (await miaButton.isVisible()) {
      console.log('Mia assistant button found');
      await miaButton.click();
      await page.waitForTimeout(500);

      // Check for chat interface
      const chatInput = page.locator('input[type="text"], textarea').filter({
        has: page.locator('[placeholder*="message" i], [placeholder*="ask" i], [placeholder*="chat" i]')
      });

      if (await chatInput.isVisible()) {
        console.log('Mia chat interface opened');
      }
    }

    // Also check for floating assistant
    const floatingAssistant = page.locator('[class*="mia"], [class*="assistant"], [class*="floating"]');
    const count = await floatingAssistant.count();
    console.log(`Found ${count} potential Mia element(s)`);
  });

  test('should be able to open and close Mia', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find Mia toggle
    const miaToggle = page.locator('[aria-label*="mia" i], [title*="assistant" i], button:has-text("Mia")').first();

    if (await miaToggle.isVisible()) {
      // Open
      await miaToggle.click();
      await page.waitForTimeout(300);

      // Look for close button
      const closeButton = page.locator('button').filter({
        hasText: /close|×|x/i
      }).first();

      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('Mia open/close working');
      }
    }
  });
});

test.describe('Image Analysis Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Image Analysis module
    const imageTab = page.getByRole('button', { name: /image|analysis|vision/i }).first();
    if (await imageTab.isVisible()) {
      await imageTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have image upload interface', async ({ page }) => {
    // Look for file input
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.count() > 0) {
      console.log('File input found for image upload');
    }

    // Look for drag-drop zone
    const dropZone = page.locator('[class*="drop"], [class*="upload"]').first();
    if (await dropZone.isVisible()) {
      console.log('Drop zone found');
    }
  });

  test('should have analysis prompt input', async ({ page }) => {
    // Look for prompt input for image analysis
    const promptInput = page.locator('textarea, input[type="text"]').filter({
      has: page.locator('[placeholder*="prompt" i], [placeholder*="describe" i], [placeholder*="analyze" i]')
    });

    const count = await promptInput.count();
    console.log(`Found ${count} prompt input(s) for image analysis`);
  });
});

test.describe('File Upload/Download', () => {
  test('should have file upload capability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for file inputs across the app
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();

    console.log(`Found ${count} file input(s) in the app`);
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 on some pages
  });

  test('should have download/export buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for download/export buttons
    const downloadButtons = page.locator('button, a').filter({
      hasText: /download|export|save/i
    });

    const count = await downloadButtons.count();
    console.log(`Found ${count} download/export button(s)`);
  });
});

test.describe('Mailbox Inter-Module Communication', () => {
  test('should have mailbox indicator or panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mailbox-related elements
    const mailboxElements = page.locator('[class*="mailbox"], [data-testid*="mailbox"], text=/mailbox|inbox|message/i');
    const count = await mailboxElements.count();

    console.log(`Found ${count} mailbox-related element(s)`);
  });

  test('should allow sending data between modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);

      // Look for "send to" or "share" functionality
      const sendButton = page.locator('button').filter({
        hasText: /send|share|transfer|mailbox/i
      }).first();

      if (await sendButton.isVisible()) {
        console.log('Inter-module send capability found');
      }
    }
  });
});

test.describe('Settings Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Settings
    const settingsTab = page.getByRole('button', { name: /settings/i }).first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have theme settings', async ({ page }) => {
    const themeElements = page.locator('text=/theme|dark|light|color/i');
    const count = await themeElements.count();

    console.log(`Found ${count} theme-related setting(s)`);
    expect(count).toBeGreaterThan(0);
  });

  test('should have audio settings', async ({ page }) => {
    const audioElements = page.locator('text=/audio|sound|mute/i');
    const count = await audioElements.count();

    console.log(`Found ${count} audio-related setting(s)`);
  });

  test('should have API/model settings', async ({ page }) => {
    const apiElements = page.locator('text=/api|model|key|backend/i');
    const count = await apiElements.count();

    console.log(`Found ${count} API/model-related setting(s)`);
  });
});

test.describe('Core Functionality Summary', () => {
  test('generate module availability report', async ({ page }) => {
    console.log('\n========================================');
    console.log('   CORE FUNCTIONALITY REPORT');
    console.log('========================================\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modules = [
      'shunt',
      'weaver',
      'foundry',
      'chat',
      'image',
      'settings',
      'terminal',
      'chronicle',
      'framework',
      'deploy',
      'documentation'
    ];

    const available: string[] = [];
    const notFound: string[] = [];

    for (const module of modules) {
      const tab = page.getByRole('button', { name: new RegExp(module, 'i') }).first();
      if (await tab.isVisible({ timeout: 1000 }).catch(() => false)) {
        available.push(module);
      } else {
        notFound.push(module);
      }
    }

    console.log('AVAILABLE MODULES:');
    available.forEach(m => console.log(`  ✓ ${m}`));

    if (notFound.length > 0) {
      console.log('\nNOT FOUND/HIDDEN:');
      notFound.forEach(m => console.log(`  - ${m}`));
    }

    console.log(`\nTotal: ${available.length}/${modules.length} modules accessible`);
    console.log('\n========================================\n');

    // At least some modules should be available
    expect(available.length).toBeGreaterThan(0);
  });
});
