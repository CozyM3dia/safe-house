import assert from 'node:assert';
import { resolveStandardDoc, parseBuildingCodes } from './standards.js';

console.log('Testing standards.js ...');

// Test 1: Exact matches
const s1 = resolveStandardDoc('SNI 1726:2019');
assert.strictEqual(s1.url, 'https://sispk.bsn.go.id/SNI/Detail/12713');
assert.strictEqual(s1.badge, 'BSN SISPK');

const s2 = resolveStandardDoc('SNI 8460:2017');
assert.strictEqual(s2.url, 'https://sispk.bsn.go.id/SNI/Detail/11425');

const s3 = resolveStandardDoc('PBG/SLF');
assert.strictEqual(s3.url, 'https://simbg.pu.go.id/');
assert.strictEqual(s3.badge, 'SIMBG PUPR');

// Test 2: AI Variations
const s4 = resolveStandardDoc('Standar PBG / Permen PUPR');
assert.ok(s4.url.includes('simbg.pu.go.id') || s4.url.includes('jdih.pu.go.id'));

// Test 3: Markdown parsing
const sampleMarkdown = `
- **SNI 1726:2019**: Mandatory for seismic design parameters and site-specific response spectra.
- **SNI 8460:2017**: Governs geotechnical design requirements for deep foundations and liquefaction mitigation.
- **PBG/SLF**: Compliance with local building codes is required to ensure structural integrity and safety against identified hazards.
`;

const parsed = parseBuildingCodes(sampleMarkdown);
assert.strictEqual(parsed.length, 3);
assert.strictEqual(parsed[0].code, 'SNI 1726:2019');
assert.strictEqual(parsed[0].url, 'https://sispk.bsn.go.id/SNI/Detail/12713');
assert.strictEqual(parsed[0].description, 'Mandatory for seismic design parameters and site-specific response spectra.');

assert.strictEqual(parsed[1].code, 'SNI 8460:2017');
assert.strictEqual(parsed[1].url, 'https://sispk.bsn.go.id/SNI/Detail/11425');

assert.strictEqual(parsed[2].code, 'PBG/SLF');
assert.strictEqual(parsed[2].url, 'https://simbg.pu.go.id/');
assert.strictEqual(parsed[2].description, 'Compliance with local building codes is required to ensure structural integrity and safety against identified hazards.');

console.log('✅ All standards tests passed successfully!');
