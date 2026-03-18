import { ProjectSchema } from '../apps/web/src/lib/validation';

declare const process: any;


const longTitle = 'A'.repeat(300);
console.log(`Testing with title length: ${longTitle.length}`);

try {
    ProjectSchema.parse({ title: longTitle });
    console.log('✅ Validation passed for 300 characters title');
} catch (error) {
    console.error('❌ Validation failed:');
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
}

const veryLongTitle = 'B'.repeat(1001);
console.log(`Testing with title length: ${veryLongTitle.length}`);
try {
    ProjectSchema.parse({ title: veryLongTitle });
    console.error('❌ Validation should have failed for 1001 characters title');
    process.exit(1);
} catch (error) {
    console.log('✅ Validation failed as expected for 1001 characters title');
}
