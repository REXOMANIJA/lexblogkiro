# Supabase Service Tests

## Setup Required

Before running the property-based tests, you need to create a test admin user in your Supabase project.

### Create Test Admin User

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user** → **Create new user**
5. Enter the credentials from your `.env` file:
   - Email: `admin@lexblog.com` (or value of `VITE_TEST_ADMIN_EMAIL`)
   - Password: `admin123` (or value of `VITE_TEST_ADMIN_PASSWORD`)
6. **Important**: Uncheck "Auto Confirm User" if email confirmation is enabled
7. Click **Create user**

### Running Tests

Once the test admin user is created, you can run the tests:

```bash
npm test
```

Or run only the property tests:

```bash
npm test -- src/services/supabase.property.test.ts
```

### Test Coverage

The property-based tests verify:
- **Property 1**: Posts are sorted in reverse chronological order
- **Property 5**: Created posts appear in the feed
- **Property 8**: Post updates are persisted
- **Property 9**: Deleted posts are removed from the feed
- **Property 10**: Deletion removes both database record and storage files

Each test runs multiple iterations with randomly generated data to ensure correctness across all inputs.
