# Test Setup Instructions

## Create Test Admin User

Before running the property-based tests for the Supabase service, you need to create a test admin user.

### Steps:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `dtatnhzupgwizypqvvzw`
3. Navigate to **Authentication** → **Users** in the left sidebar
4. Click **Add user** → **Create new user**
5. Enter the following credentials:
   - **Email**: `admin@lexblog.com`
   - **Password**: `admin123`
6. **Important**: If you see an "Auto Confirm User" checkbox, make sure it's **checked** (enabled)
7. Click **Create user**

### Verify User Creation

After creating the user, you should see it listed in the Users table with:
- Email: admin@lexblog.com
- Status: Confirmed (green checkmark)

### Run Tests

Once the test admin user is created, you can run the property-based tests:

```bash
npm test -- src/services/supabase.property.test.ts
```

Or run all tests:

```bash
npm test
```

### Troubleshooting

**If tests fail with "Failed to authenticate test admin":**
- Verify the user was created with the exact email: `admin@lexblog.com`
- Verify the password is exactly: `admin123`
- Check that the user status is "Confirmed" (not "Waiting for verification")
- If the user needs email confirmation, go back and confirm the email manually in the dashboard

**If tests fail with "401 Unauthorized":**
- The user might not be confirmed yet
- Go to Authentication → Users, find the user, and click the three dots → "Confirm user"

### What the Tests Verify

The property-based tests verify the following correctness properties:

1. **Property 1**: Posts are sorted in reverse chronological order
2. **Property 5**: Created posts appear in the feed
3. **Property 8**: Post updates are persisted
4. **Property 9**: Deleted posts are removed from the feed
5. **Property 10**: Deletion removes both database record and storage files

Each test runs 10 iterations with randomly generated data to ensure correctness across all inputs.
