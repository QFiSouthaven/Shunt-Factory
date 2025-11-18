/**
 * GitHub Actions Workflows Tests
 * Validates CI/CD workflow configurations
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const WORKFLOWS_DIR = path.resolve(__dirname, '..');

interface WorkflowJob {
  name?: string;
  'runs-on': string;
  steps: Array<{
    name?: string;
    uses?: string;
    run?: string;
    with?: Record<string, any>;
    env?: Record<string, any>;
    if?: string;
  }>;
  needs?: string | string[];
  environment?: {
    name: string;
    url?: string;
  } | string;
  strategy?: {
    matrix?: Record<string, any[]>;
  };
  'timeout-minutes'?: number;
}

interface Workflow {
  name: string;
  on: any;
  jobs: Record<string, WorkflowJob>;
  concurrency?: {
    group: string;
    'cancel-in-progress'?: boolean;
  };
}

describe('GitHub Actions Workflows', () => {
  describe('CI Workflow (ci.yml)', () => {
    let workflow: Workflow;

    beforeAll(() => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'ci.yml'), 'utf8');
      workflow = yaml.load(content) as Workflow;
    });

    it('should have valid YAML syntax', () => {
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('CI');
    });

    it('should trigger on push to main and develop', () => {
      expect(workflow.on.push.branches).toContain('main');
      expect(workflow.on.push.branches).toContain('develop');
    });

    it('should trigger on pull requests', () => {
      expect(workflow.on.pull_request).toBeDefined();
      expect(workflow.on.pull_request.branches).toContain('main');
      expect(workflow.on.pull_request.branches).toContain('develop');
    });

    it('should have concurrency control', () => {
      expect(workflow.concurrency).toBeDefined();
      expect(workflow.concurrency?.group).toContain('github.workflow');
      expect(workflow.concurrency?.['cancel-in-progress']).toBe(true);
    });

    describe('Lint Job', () => {
      it('should exist and be properly configured', () => {
        const lint = workflow.jobs.lint;
        expect(lint).toBeDefined();
        expect(lint.name).toBe('Lint & Type Check');
        expect(lint['runs-on']).toBe('ubuntu-latest');
        expect(lint['timeout-minutes']).toBe(10);
      });

      it('should checkout code', () => {
        const checkoutStep = workflow.jobs.lint.steps.find(s => s.uses?.includes('actions/checkout'));
        expect(checkoutStep).toBeDefined();
      });

      it('should setup Node.js 20', () => {
        const nodeStep = workflow.jobs.lint.steps.find(s => s.uses?.includes('actions/setup-node'));
        expect(nodeStep).toBeDefined();
        expect(nodeStep?.with?.['node-version']).toBe('20');
        expect(nodeStep?.with?.cache).toBe('npm');
      });

      it('should run TypeScript type checking', () => {
        const typeCheckStep = workflow.jobs.lint.steps.find(s =>
          s.run?.includes('tsc --noEmit')
        );
        expect(typeCheckStep).toBeDefined();
      });
    });

    describe('Build Job', () => {
      it('should exist and build for all environments', () => {
        const build = workflow.jobs.build;
        expect(build).toBeDefined();
        expect(build.strategy?.matrix?.environment).toEqual(['development', 'staging', 'production']);
      });

      it('should have reasonable timeout', () => {
        expect(workflow.jobs.build['timeout-minutes']).toBe(15);
      });

      it('should use environment variable for build', () => {
        const buildStep = workflow.jobs.build.steps.find(s =>
          s.run?.includes('npm run build')
        );
        expect(buildStep?.env?.VITE_APP_ENV).toBeDefined();
      });

      it('should upload build artifacts', () => {
        const uploadStep = workflow.jobs.build.steps.find(s =>
          s.uses?.includes('actions/upload-artifact')
        );
        expect(uploadStep).toBeDefined();
        expect(uploadStep?.with?.['retention-days']).toBe(7);
      });
    });

    describe('Security Job', () => {
      it('should run security scans', () => {
        const security = workflow.jobs.security;
        expect(security).toBeDefined();
        expect(security.name).toBe('Security Scan');
      });

      it('should run npm audit', () => {
        const auditStep = workflow.jobs.security.steps.find(s =>
          s.run?.includes('npm audit')
        );
        expect(auditStep).toBeDefined();
        expect(auditStep?.['continue-on-error']).toBe(true);
      });

      it('should check for vulnerabilities', () => {
        const vulnCheck = workflow.jobs.security.steps.find(s =>
          s.run?.includes('npm-check-updates')
        );
        expect(vulnCheck).toBeDefined();
      });
    });

    describe('Dependencies Job', () => {
      it('should check for outdated dependencies', () => {
        const deps = workflow.jobs.dependencies;
        expect(deps).toBeDefined();
        expect(deps['timeout-minutes']).toBe(5);
      });

      it('should run npm outdated', () => {
        const outdatedStep = workflow.jobs.dependencies.steps.find(s =>
          s.run?.includes('npm outdated')
        );
        expect(outdatedStep).toBeDefined();
      });
    });

    describe('Size Analysis Job', () => {
      it('should only run on pull requests', () => {
        const sizeAnalysis = workflow.jobs['size-analysis'];
        expect(sizeAnalysis).toBeDefined();
        expect(sizeAnalysis.if).toContain('pull_request');
      });

      it('should analyze bundle size', () => {
        const analyzeStep = workflow.jobs['size-analysis'].steps.find(s =>
          s.run?.includes('du -sh dist/')
        );
        expect(analyzeStep).toBeDefined();
      });
    });

    describe('All Checks Job', () => {
      it('should depend on critical jobs', () => {
        const allChecks = workflow.jobs['all-checks'];
        expect(allChecks.needs).toContain('lint');
        expect(allChecks.needs).toContain('build');
        expect(allChecks.needs).toContain('security');
        expect(allChecks.needs).toContain('dependencies');
      });

      it('should always run', () => {
        expect(workflow.jobs['all-checks'].if).toBe('always()');
      });

      it('should verify all job results', () => {
        const checkStep = workflow.jobs['all-checks'].steps[0];
        expect(checkStep.run).toContain('needs.lint.result');
        expect(checkStep.run).toContain('needs.build.result');
      });
    });
  });

  describe('Staging Deployment Workflow (deploy-staging.yml)', () => {
    let workflow: Workflow;

    beforeAll(() => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-staging.yml'), 'utf8');
      workflow = yaml.load(content) as Workflow;
    });

    it('should have valid YAML syntax', () => {
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Deploy to Staging');
    });

    it('should trigger on push to develop branch', () => {
      expect(workflow.on.push.branches).toContain('develop');
    });

    it('should support manual workflow dispatch', () => {
      expect(workflow.on.workflow_dispatch).toBeDefined();
      expect(workflow.on.workflow_dispatch.inputs?.reason).toBeDefined();
    });

    describe('Deploy Job', () => {
      it('should have staging environment configured', () => {
        const deploy = workflow.jobs['deploy-staging'];
        expect(deploy.environment).toBeDefined();

        if (typeof deploy.environment === 'object') {
          expect(deploy.environment.name).toBe('staging');
          expect(deploy.environment.url).toBe('https://staging.aethershunt.com');
        }
      });

      it('should have reasonable timeout', () => {
        expect(workflow.jobs['deploy-staging']['timeout-minutes']).toBe(15);
      });

      it('should build with staging environment', () => {
        const buildStep = workflow.jobs['deploy-staging'].steps.find(s =>
          s.run?.includes('npm run build')
        );
        expect(buildStep?.env?.VITE_APP_ENV).toBe('staging');
      });

      it('should verify build output', () => {
        const verifyStep = workflow.jobs['deploy-staging'].steps.find(s =>
          s.run?.includes('test -f dist/index.html')
        );
        expect(verifyStep).toBeDefined();
      });

      it('should have deployment options configured', () => {
        const steps = workflow.jobs['deploy-staging'].steps;

        // Should have Vercel deployment option
        const vercelStep = steps.find(s => s.name?.includes('Vercel'));
        expect(vercelStep).toBeDefined();

        // Should have Netlify deployment option
        const netlifyStep = steps.find(s => s.name?.includes('Netlify'));
        expect(netlifyStep).toBeDefined();

        // Should have AWS deployment option
        const awsStep = steps.find(s => s.name?.includes('AWS'));
        expect(awsStep).toBeDefined();
      });

      it('should send deployment notification', () => {
        const notifyStep = workflow.jobs['deploy-staging'].steps.find(s =>
          s.name?.includes('notification')
        );
        expect(notifyStep).toBeDefined();
      });
    });
  });

  describe('Production Deployment Workflow (deploy-production.yml)', () => {
    let workflow: Workflow;

    beforeAll(() => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-production.yml'), 'utf8');
      workflow = yaml.load(content) as Workflow;
    });

    it('should have valid YAML syntax', () => {
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Deploy to Production');
    });

    it('should trigger on push to main branch', () => {
      expect(workflow.on.push.branches).toContain('main');
    });

    it('should trigger on version tags', () => {
      expect(workflow.on.push.tags).toContain('v*.*.*');
    });

    it('should require reason for manual deployment', () => {
      expect(workflow.on.workflow_dispatch.inputs.reason.required).toBe(true);
    });

    describe('Pre-Deploy Checks Job', () => {
      it('should run before deployment', () => {
        const preCheck = workflow.jobs['pre-deploy-checks'];
        expect(preCheck).toBeDefined();
        expect(preCheck.name).toBe('Pre-Deployment Checks');
      });

      it('should run type checking', () => {
        const typeCheck = workflow.jobs['pre-deploy-checks'].steps.find(s =>
          s.run?.includes('tsc --noEmit')
        );
        expect(typeCheck).toBeDefined();
      });

      it('should run security audit with high threshold', () => {
        const audit = workflow.jobs['pre-deploy-checks'].steps.find(s =>
          s.run?.includes('npm audit --audit-level=high')
        );
        expect(audit).toBeDefined();
        expect(audit?.['continue-on-error']).toBe(false);
      });

      it('should test production build', () => {
        const buildTest = workflow.jobs['pre-deploy-checks'].steps.find(s =>
          s.run?.includes('npm run build')
        );
        expect(buildTest?.env?.VITE_APP_ENV).toBe('production');
      });
    });

    describe('Deploy Production Job', () => {
      it('should depend on pre-deploy checks', () => {
        const deploy = workflow.jobs['deploy-production'];
        expect(deploy.needs).toBe('pre-deploy-checks');
      });

      it('should have production environment configured', () => {
        const deploy = workflow.jobs['deploy-production'];

        if (typeof deploy.environment === 'object') {
          expect(deploy.environment.name).toBe('production');
          expect(deploy.environment.url).toBe('https://aethershunt.com');
        }
      });

      it('should have longer timeout for production', () => {
        expect(workflow.jobs['deploy-production']['timeout-minutes']).toBe(20);
      });

      it('should verify production build quality', () => {
        const verifyStep = workflow.jobs['deploy-production'].steps.find(s =>
          s.run?.includes('Verifying production build')
        );
        expect(verifyStep).toBeDefined();

        // Should check for console.log
        expect(verifyStep?.run).toContain('console.log');

        // Should check bundle sizes
        expect(verifyStep?.run).toContain('du -sh dist/');
      });

      it('should support multiple deployment platforms', () => {
        const steps = workflow.jobs['deploy-production'].steps;

        // Vercel
        expect(steps.some(s => s.name?.includes('Vercel'))).toBe(true);

        // Netlify
        expect(steps.some(s => s.name?.includes('Netlify'))).toBe(true);

        // AWS S3
        expect(steps.some(s => s.name?.includes('AWS'))).toBe(true);

        // GitHub Pages
        expect(steps.some(s => s.name?.includes('GitHub Pages'))).toBe(true);
      });

      it('should create GitHub release for tags', () => {
        const releaseStep = workflow.jobs['deploy-production'].steps.find(s =>
          s.uses?.includes('actions/create-release')
        );
        expect(releaseStep).toBeDefined();
        expect(releaseStep?.if).toContain('startsWith(github.ref, \'refs/tags/\')');
      });
    });

    describe('Post-Deploy Verification Job', () => {
      it('should run after deployment', () => {
        const postDeploy = workflow.jobs['post-deploy-verification'];
        expect(postDeploy.needs).toBe('deploy-production');
      });

      it('should run health checks', () => {
        const healthCheck = workflow.jobs['post-deploy-verification'].steps.find(s =>
          s.name?.includes('Health check')
        );
        expect(healthCheck).toBeDefined();
      });

      it('should run smoke tests', () => {
        const smokeTest = workflow.jobs['post-deploy-verification'].steps.find(s =>
          s.name?.includes('Smoke tests')
        );
        expect(smokeTest).toBeDefined();
      });

      it('should have short timeout', () => {
        expect(workflow.jobs['post-deploy-verification']['timeout-minutes']).toBe(5);
      });
    });
  });

  describe('Workflow Best Practices', () => {
    const workflowFiles = ['ci.yml', 'deploy-staging.yml', 'deploy-production.yml'];

    workflowFiles.forEach(fileName => {
      describe(`${fileName}`, () => {
        let workflow: Workflow;

        beforeAll(() => {
          const content = fs.readFileSync(path.join(WORKFLOWS_DIR, fileName), 'utf8');
          workflow = yaml.load(content) as Workflow;
        });

        it('should have a descriptive name', () => {
          expect(workflow.name).toBeDefined();
          expect(workflow.name.length).toBeGreaterThan(0);
        });

        it('should use ubuntu-latest runners', () => {
          Object.values(workflow.jobs).forEach(job => {
            expect(job['runs-on']).toBe('ubuntu-latest');
          });
        });

        it('should have timeout limits on jobs that perform work', () => {
          // Summary/verification jobs may not need timeouts, but work jobs should
          const workJobs = Object.entries(workflow.jobs).filter(([name]) =>
            !name.includes('all-checks') && !name.includes('post-deploy-verification')
          );

          workJobs.forEach(([name, job]) => {
            expect(job['timeout-minutes'], `Job ${name} should have timeout`).toBeDefined();
            expect(job['timeout-minutes']).toBeGreaterThan(0);
            expect(job['timeout-minutes']).toBeLessThanOrEqual(60);
          });

          // Should have at least some jobs with timeouts
          expect(workJobs.length).toBeGreaterThan(0);
        });

        it('should checkout code in jobs that need it', () => {
          // Jobs that build, test, or deploy need to checkout code
          // Summary/aggregation jobs may not need code
          const jobsNeedingCode = Object.entries(workflow.jobs).filter(([name]) =>
            !name.includes('all-checks') && !name.includes('post-deploy-verification')
          );

          jobsNeedingCode.forEach(([name, job]) => {
            const hasCheckout = job.steps.some(s =>
              s.uses?.includes('actions/checkout')
            );
            expect(hasCheckout, `Job ${name} should checkout code`).toBe(true);
          });

          // Should have at least some jobs that checkout code
          expect(jobsNeedingCode.length).toBeGreaterThan(0);
        });

        it('should use specific versions for actions', () => {
          Object.values(workflow.jobs).forEach(job => {
            job.steps.forEach(step => {
              if (step.uses) {
                // Should have version pinning (v4, v3, etc.)
                expect(step.uses).toMatch(/@v\d+/);
              }
            });
          });
        });
      });
    });
  });

  describe('Security Considerations', () => {
    it('CI workflow should not expose secrets', () => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'ci.yml'), 'utf8');

      // Should not have hardcoded secrets
      expect(content).not.toMatch(/password:\s*[a-zA-Z0-9]+/);
      expect(content).not.toMatch(/token:\s*[a-zA-Z0-9]{20,}/);
    });

    it('deployment workflows should use GitHub secrets', () => {
      const stagingContent = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-staging.yml'), 'utf8');
      const productionContent = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-production.yml'), 'utf8');

      // Should reference secrets correctly
      expect(stagingContent).toMatch(/\$\{\{ secrets\./);
      expect(productionContent).toMatch(/\$\{\{ secrets\./);
    });

    it('production workflow should have stricter audit level', () => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-production.yml'), 'utf8');
      expect(content).toContain('--audit-level=high');
    });
  });

  describe('Environment Configuration', () => {
    it('staging deployment should use staging environment', () => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-staging.yml'), 'utf8');
      const workflow = yaml.load(content) as Workflow;

      const buildStep = workflow.jobs['deploy-staging'].steps.find(s =>
        s.run?.includes('npm run build')
      );
      expect(buildStep?.env?.VITE_APP_ENV).toBe('staging');
    });

    it('production deployment should use production environment', () => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, 'deploy-production.yml'), 'utf8');
      const workflow = yaml.load(content) as Workflow;

      const buildStep = workflow.jobs['deploy-production'].steps.find(s =>
        s.run?.includes('npm run build')
      );
      expect(buildStep?.env?.VITE_APP_ENV).toBe('production');
    });
  });
});
