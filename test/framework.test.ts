import pkg from '../package.json';
import Application from '../src/index';
import FoundationApp from '@ostro/foundation';

describe('@ostro/framework meta-package', () => {
    test('package.json metadata and dependencies definitions', () => {
        expect(pkg.name).toBe('@ostro/framework');
        expect(pkg.version).toBeDefined();
        expect(pkg.description).toBe('MVC framework for NodeJS');

        const expectedDependencies = [
            '@ostro/auth',
            '@ostro/cache',
            '@ostro/config',
            '@ostro/console',
            '@ostro/container',
            '@ostro/contracts',
            '@ostro/cookie',
            '@ostro/database',
            '@ostro/encryption',
            '@ostro/filesystem',
            '@ostro/http',
            '@ostro/logger',
            '@ostro/router',
            '@ostro/session',
            '@ostro/server',
            '@ostro/serverless',
            '@ostro/support',
            '@ostro/validation',
            '@ostro/view',
            '@ostro/foundation'
        ];

        for (const dep of expectedDependencies) {
            expect(pkg.dependencies[dep]).toBeDefined();
        }
    });

    test('package.json repository, keywords, and license', () => {
        expect(pkg.license).toBe('MIT');
        expect(Array.isArray(pkg.keywords)).toBe(true);
        expect(pkg.keywords).toContain('ostrojs');
        expect(pkg.keywords).toContain('framework');
        expect(pkg.repository.type).toBe('git');
        expect(pkg.repository.url).toContain('ostrojs/framework');
    });

    test('Application export matches foundation Application', () => {
        expect(Application).toBeDefined();
        expect(Application).toBe(FoundationApp);
        const originalCwd = process.cwd();
        try {
            const app = new Application(__dirname);
            expect(app).toBeInstanceOf(FoundationApp);
            expect(app.basePath()).toContain('test');
        } finally {
            process.chdir(originalCwd);
        }
    });
});
