import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

const db = process.env.DB_DATABASE ?? '';
if (!db.endsWith('_test_db')) {
  throw new Error(
    `SAFETY GUARD: DB_DATABASE="${db}" must end with "_test_db". ` +
      `Refusing to run e2e tests against a non-test database.`,
  );
}
