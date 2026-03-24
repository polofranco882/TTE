const fs = require('fs');
const results = JSON.parse(fs.readFileSync('playwright-report/results.json', 'utf8'));

results.suites.forEach(suite => {
    suite.suites?.forEach(subSuite => {
        subSuite.specs?.forEach(spec => {
            if (!spec.ok) {
                console.log(`\n\nFAIL: ${subSuite.title} > ${spec.title}`);
                const testRun = spec.tests[0].results[0]; // first try
                if (testRun && testRun.error) {
                    console.log(`Error: ${testRun.error.message.substring(0, 500)}`);
                }
            }
        });
    });
});
