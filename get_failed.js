const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('playwright-report/results.json', 'utf8'));
  const failed = [];
  function extract(suites) {
    if (!suites) return;
    for (let s of suites) {
      if (s.specs) {
        for (let sp of s.specs) {
          if (!sp.ok) failed.push(sp.title);
        }
      }
      extract(s.suites);
    }
  }
  extract(data.suites);
  console.log("FAILED TESTS:", failed);
} catch (err) {
  console.error(err);
}
