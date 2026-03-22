const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT table_name, column_name FROM information_schema.columns WHERE data_type = 'jsonb' AND table_name LIKE 'landing_%'")
.then(res => {
  fs.writeFileSync('result.json', JSON.stringify(res.rows, null, 2));
})
.catch(e => console.error(e.message))
.finally(() => p.end());
