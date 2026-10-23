// Runs before every test file. Points the app at the test database and satisfies the environment check.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://tapisode:tapisode@localhost:5432/tapisode_test";
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-12";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.MEDIA_PROVIDER = "fake";
process.env.LEGAL_CONTROLLER_NAME = "Test Controller";
process.env.LEGAL_CONTACT_EMAIL = "legal@example.test";
