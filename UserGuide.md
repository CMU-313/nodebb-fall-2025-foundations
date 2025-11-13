# Admin Login Information:
username: team17
password: Josh1234$

# Feature: Create Category
1. Go to the Categories page on the frontend
2. Login as admin
3. Confirm that a “Create New Category” button is visible (requires appropriate permissions)
4. Click the “Create New Category” button
5. Fill in the category name
6. Submit the form
7. Try these conditions:
     - Success: Category is created, a success popup appears, and the new category is listed on the page
     - Invalid input: If the name is missing, too short, too long, or contains invalid characters, an error popup appears
     - Duplicate category names: If a category with the same name already exists, an error popup appears

Automated Tests:
- Location: test/categories.js
- What’s being tested:
     - Successful creation of a new category with valid data
     - Handling of invalid category names (too short, too long, special characters)
     - Duplicate category creation prevention
     - Successful name update
     - Authorization (admin vs regular user)
     - Same name update (no change)
     - Case-insensitive duplicate name detection
     - Successful controller updating and responses:
        - 403 unauthorized response
        - 400 invalid data response
Rationale: These tests cover the main functionality and edge cases of the create category feature. They ensure that the backend logic, validation, and API endpoints are functioning as expected.

—

# Feature: Edit Category
1. Go to the Categories page on the frontend
2. Login as admin
3. Locate existing categories and click the edit button (icon)
4. Modify the desired fields, (ex. category name or description)
5. Hit submit/enter
6. Try these three conditions:
     - Success: The category is updated, a success popup appears, and changes are reflected immediately on the page
     - Invalid input: Errors appear if the new name is invalid (empty, too long, contains invalid characters)
     - Duplicate names: If renaming a category to an existing category name, an error popup appears
Automated Tests:
- Location: test/categories.js 
- What’s being tested:
     - Successful editing of category name and/or description
     - Handling of invalid category names (too short, too long, special characters)
     - Prevention of duplicate names during edit
     - Authorization (admin vs. regular user)
     - Successful name update
     - Case-insensitive duplicate name detection
     - Verification of correct HTTP status codes and API responses
Rationale: Similarly to the create function, these tests make sure the edit functionality maintains consistency and integrity of category data. They also confirm that the user-facing validations match backend rules.

—

# Feature: Delete Category
## How to Use
1. Go to the Categories page on the frontend forum
2. Login as admin 
3. Locate existing categories and click the red delete button (trash can icon)
4. Hit confirm on the pop-up to permanently remove category and its contents
5. Can also navigate to the category list in Admin Panel -> Manage -> Categories
6. Locate existing categories and click the red delete button (trash can icon)
7. Hit confirm on the pop-up to permanently remove category and its contents

## How to Test
1. Visibility tests
     - As admin, verify delete button is present for all categories
     - As owner, verify delete button is present for all owned categories
     - As regular user, verify no delete button is visible
2. Purge action
     - Click delete on existing category, confirm destructive dialog
     - Verify that:
        - Success: Category purged pop-up message appears
        - Category list updates and the deleted category disappears
        - Topics and posts in the category are all removed 
        - No 500 errors occur or unintended data loss outside expected purge scope
3. Unauthorized request
     - An attempt to call the purge API directly as a low-privilege user should result in a 403 error and no deletion of the category
4. Specific scenarios
     - As admin, create a category and a topic inside the new category
     - Delete the category and confirm the category and topic are deleted

## Automated Tests:
- Location: test/category-create-delete.js 
- What’s being tested:
     - Successful deletion of category and all its contents
     - Asserts only admins and owners are able to delete categories (owned)
     - Ensures all category objects include the “purgable” (allowPurge) visibility flags where appropriate
     - Verifies which users see delete controls (admins and owners)
     - Verifies the API and client flows produce expected results, from UI to confirmation to API call to server action
     - Creates topics (normal, pinned, and scheduled types) inside categories as part of setup so deletion effects are validated end-to-end
     - Creates parent category with child in a test to verify child was not purged on parent category deletion
     - Creates topics with flagged posts in a test to verify that the flag is resolved on category deletion

Rationale: The automated tests sufficiently cover the delete category feature because:
      - Complete coverage: ensure end-to-end coverage for the deletion feature across the UI, API, and DB, which ensures that both client behavior and server permission checks are validated together.
     - Permission validations: the test suite checks both positive and negative assertions (admins can delete and regular users cannot delete), which is one of the most important parts of the delete feature.
     - Cross-cutting checks: by creating topics (pinned and scheduled), flagged posts, and child categories in the parent category during the tests, the suite catches any side effects that could occur during category deletion.

—

# Feature: Mark as Resolved/Unresolved

## How to Use

### Accessing the Feature
1. Navigate to the "Comments & Feedback" category
2. Open any topic/post within this category
3. Locate the "Mark as Resolved/Unresolved" button in the topic toolbar
### Marking a Post as Resolved
1. Click the "Mark as Resolved" button (appears as a checkmark icon)
2. The button will toggle to show the new status
3. A confirmation message will appear
4. The topic will display a green "✓ Resolved" badge in the category view
### Marking a Post as Unresolved
1. Click the "Mark as Unresolved" button on a resolved post
2. The status will toggle back to unresolved
3. The topic will display a yellow "? Unresolved" badge in the category view
### Who Can Mark Posts
- **Post Author**: Can mark their own posts as resolved/unresolved
- **Admins**: Can mark any post in Comments & Feedback as resolved/unresolved
- **Moderators**: Can mark any post in Comments & Feedback as resolved/unresolved
### Visual Indicators
- **Resolved Posts**: Display a green badge with checkmark icon and "Resolved" text
- **Unresolved Posts**: Display a yellow/amber badge with question mark icon and "Unresolved" text
- **Badges Appear**: Next to topic titles in the category list view
### Feature Scope
- **Available In**: Comments & Feedback category only
- **Not Available In**: General Discussion, Announcements, or other categories

## How to Test

### Test Case 1: Mark Own Post as Resolved (Student)
1. Create a new user account (if testing as a student)
2. Navigate to Comments & Feedback category
3. Create a new topic with a question
4. Verify the topic shows "? Unresolved" badge in category view
5. Open the topic and click "Mark as Resolved"
6. Return to category view and verify the badge changed to "✓ Resolved"
7. Open the topic again and click "Mark as Unresolved"
8. Verify the badge returns to "? Unresolved"
### Test Case 2: Admin/Moderator Marking Any Post (Instructor)
1. Log in as an admin or moderator account
2. Navigate to Comments & Feedback category
3. Find a topic created by another user
4. Open the topic and verify you can see the resolve/unresolve button
5. Toggle the status and verify the badge changes in category view
6. Verify you can change the status of any post, not just your own
### Test Case 3: Category Restriction
1. Navigate to a different category (e.g., General Discussion)
2. Open any topic in that category
3. Verify that the "Mark as Resolved" button does NOT appear
4. Confirm the feature is restricted to Comments & Feedback only
### Test Case 4: Permission Validation
1. Log in as a regular user (non-admin, non-moderator)
2. Navigate to Comments & Feedback
3. Open a topic created by someone else
4. Verify you CANNOT see the resolve button for others' posts
5. Open your own topic and verify you CAN see the button

## Automated Tests

### Test Location
- **File**: `test/posts/resolved.js`
- **Location**: `/workspaces/nodebb-fall-2025-foundations/test/posts/resolved.js`

### What is Being Tested
1. **Resolve Status Toggle**
   - Tests that posts can be marked as resolved (status = 1)
   - Tests that posts can be marked as unresolved (status = 0)
   - Verifies database field updates correctly
2. **Permission Validation**
   - Tests that post authors can mark their own posts as resolved
   - Tests that admins can mark any post as resolved
   - Tests that moderators can mark any post in their moderated category
   - Tests that unauthorized users CANNOT mark posts as resolved
3. **API Endpoints**
   - Tests POST `/api/v3/posts/{pid}/resolve` endpoint
   - Tests POST `/api/v3/posts/{pid}/unresolve` endpoint
   - Verifies proper HTTP status codes (200 for success, 403 for forbidden)
   - Validates API response structure matches schema
4. **Category Restriction**
   - Tests that the feature only works in Comments & Feedback category
   - Verifies posts in other categories cannot be marked as resolved
5. **Database Persistence**
   - Tests that resolved status persists across sessions
   - Verifies the `resolved` field is correctly stored in post objects
   - Tests that status changes are immediately reflected in API responses

### Rationale for Testing
The automated tests are sufficient for covering the Mark as Resolved feature because:
1. **Comprehensive Permission Coverage**: Tests verify all three user types (author, admin, moderator) have correct permissions, and unauthorized users are blocked
2. **API Contract Validation**: Tests ensure the API endpoints work correctly and return proper status codes and response structures
3. **Database Integrity**: Tests verify that resolved status is correctly persisted to the database and retrieved
4. **Category Scope Enforcement**: Tests confirm the feature is properly restricted to Comments & Feedback category only
5. **Edge Cases**: Tests cover toggling between resolved/unresolved states multiple times, ensuring state management is robust
6. **Integration with Existing Code**: Tests verify the feature integrates properly with NodeBB's existing post and privilege systems

—

# Feature: Needs Attention

## How to Use

### For Administrators and Moderators
1. Navigate to the "Comments & Feedback" category
2. Posts that need attention will automatically appear at the top of the list
3. Look for the following visual indicators:
   - **Orange Badge**: "Needs Attention" badge with vibrant orange background (#ff9f40)
   - **Light Orange Background**: The entire topic row is highlighted with light orange (#ffe4cc)
4. Posts needing attention are sorted by age (oldest first) at the top
5. Click on a post to read and respond
6. After addressing the question, mark the post as "Resolved" to remove the needs attention flag
### For Regular Users (Students)
- No special action required - the feature works automatically
- Regular users do not see the needs attention indicators or reordering
- Posts appear in normal chronological order for students
- If your post needs attention, an instructor will be notified automatically
### What Gets Flagged as "Needs Attention"
A post is automatically flagged when ALL of the following criteria are met:
- **Category**: The post is in the "Comments & Feedback" category
- **Age**: The post is more than 7 days old (from creation timestamp)
- **Status**: The post is marked as "Unresolved"
- **Inactivity**: There have been no replies in the last 3 days
### How the Flag Is Removed
The "Needs Attention" flag is automatically removed when:
- The post is marked as "Resolved"
- Someone adds a reply (resets the 3-day inactivity timer)
- The post is moved to a different category
- The post becomes less than 7 days old (not possible, but included for completeness)
### Privilege Visibility
- **Admins**: Can see all needs attention indicators and pinned ordering
- **Moderators**: Can see all needs attention indicators and pinned ordering
- **Regular Users**: Cannot see needs attention badges, highlights, or special ordering

## How to Test
### Test Case 1: Automatic Flagging Based on Age and Activity (Admin View)
1. Log in as an admin account
2. Create a test post in Comments & Feedback category
3. Use development tools or database manipulation to set the post timestamp to 8+ days ago
4. Ensure the post is marked as "Unresolved"
5. Ensure there are no replies in the last 3 days
6. Navigate to Comments & Feedback category
7. Verify the post appears at the top with orange badge and highlight
8. Create a similar post that is only 5 days old - verify it does NOT get flagged
### Test Case 2: Activity Resets Timer
1. Create or find a post that is 8+ days old and unresolved
2. Verify it shows "Needs Attention" flag
3. Add a reply to the post
4. Refresh the category view
5. Verify the "Needs Attention" flag is removed (recent activity resets timer)
6. Wait/simulate 4 days passing without new replies
7. Verify the flag reappears
### Test Case 3: Resolved Status Removes Flag
1. Find a post that is 8+ days old, unresolved, with no recent activity
2. Verify it shows "Needs Attention" flag
3. Mark the post as "Resolved"
4. Refresh the category view
5. Verify the "Needs Attention" flag is removed
6. Mark the post as "Unresolved" again
7. Verify the flag reappears
### Test Case 4: Admin/Moderator See Indicators, Students Do Not
1. Create a post that meets all needs attention criteria
2. Log in as an admin and navigate to Comments & Feedback
3. Verify you see the orange badge and background highlight
4. Log out and log in as a regular student user
5. Navigate to Comments & Feedback
6. Verify you do NOT see the orange badge or background highlight
7. Verify the topic order is different (normal chronological, not pinned)
### Test Case 5: Topic Reordering (Oldest First)
1. Log in as an admin
2. Create three posts that all meet needs attention criteria:
   - Post A: 10 days old
   - Post B: 8 days old
   - Post C: 15 days old
3. Navigate to Comments & Feedback category
4. Verify the order is: Post C (oldest), Post A, Post B, then all other posts
5. Log in as a regular user and verify normal chronological ordering
### Test Case 6: Category Restriction
1. Create a post in General Discussion category that is 8+ days old and unresolved
2. Log in as an admin
3. Navigate to General Discussion
4. Verify the post does NOT show "Needs Attention" flag (feature is Comments & Feedback only)
5. Navigate to Comments & Feedback
6. Verify only posts in that category can be flagged

## Automated Tests

### Test Location
- **File**: `test/topics/needsAttention.js`
- **Location**: `/workspaces/nodebb-fall-2025-foundations/test/topics/needsAttention.js`

### What is Being Tested
1. **Core Logic - Age Requirement**
   - Tests that posts younger than 7 days are NOT flagged
   - Tests that posts 7+ days old CAN be flagged (if other criteria met)
   - Uses MockDate library to simulate time passing
2. **Core Logic - Resolved Status**
   - Tests that resolved posts are NOT flagged regardless of age
   - Tests that only unresolved posts can be flagged
   - Verifies integration with resolved/unresolved feature
3. **Core Logic - Recent Activity**
   - Tests that posts with replies in the last 3 days are NOT flagged
   - Tests that posts without recent replies CAN be flagged
   - Verifies the `getLatestReplyTime()` helper function works correctly
4. **Core Logic - Category Restriction**
   - Tests that only posts in "Comments & Feedback" are flagged
   - Tests that posts in other categories are NOT flagged
   - Handles category name comparison with HTML entities (e.g., &amp;)
5. **Integration - Category Topic Listing**
   - Tests that `needsAttention` field is added to topic objects
   - Tests that the field is correctly calculated for each topic
   - Verifies integration with `categories.getCategoryTopics()`
6. **Privilege-Based Reordering**
   - Tests that admins see needs attention topics pinned at the top
   - Tests that topics are sorted by age (oldest first) when pinned
   - Tests that regular users do NOT see reordering
   - Compares admin vs regular user topic order to verify different views
7. **Edge Cases**
   - Tests handling of topics with no replies (only original post)
   - Tests topics with missing category data (returns false gracefully)
   - Tests topics that don't exist (returns false gracefully)
   - Tests boundary conditions (exactly 7 days, exactly 3 days)
8. **Time Simulation and Isolation**
   - Uses MockDate to freeze time at a known baseline
   - Creates test topics at specific timestamps relative to baseline
   - Ensures tests are deterministic and don't depend on current date/time
   - Resets MockDate after tests to prevent interference with other test suites

### Rationale for Testing
The automated tests are sufficient for covering the Needs Attention feature because:
1. **Complete Criteria Coverage**: All four criteria (category, age, resolved status, activity) are tested individually and in combination
2. **Time-Based Testing**: MockDate library ensures time-dependent logic is tested reliably without waiting for actual time to pass
3. **Privilege Separation**: Tests verify that admins/moderators see different views than regular users, ensuring proper access control
4. **Integration Testing**: Tests verify the feature integrates correctly with:
   - Category topic listing system
   - Resolved/unresolved feature
   - Post and reply systems
   - Privilege checking system
5. **Edge Case Handling**: Tests cover scenarios like missing data, empty replies, and boundary conditions to ensure robustness
6. **Real-World Workflow**: Tests simulate the complete workflow:
   - Post creation
   - Time passing
   - Activity (replies)
   - Status changes (resolved/unresolved)
   - Different user views
7. **No False Positives**: Tests verify that posts NOT meeting all criteria are correctly excluded from flagging
8. **Reordering Logic**: Tests verify that topic ordering is correct (oldest first) and only applies to privileged users
9. **Cross-Test Isolation**: Proper setup and teardown ensure tests don't interfere with each other or other test suites
10. **Performance Consideration**: Tests verify the feature calculates status in real-time without requiring background jobs or caching

# Feature: Location Field on Profile

## How to Use
1. Login as admin (or any user)
2. Navigate to profile by clicking on profile picture in top right corner and then clicking on the name at the top of the pop-up menu
3. Click on the “Add Location” link in the “About” section of the user profile
4. Fill in the information (city, state, and country) in the pop-up form (partial inputs are allowed) 
5. Press the save button to update the profile
5. Confirm the updated information is reformatted (e.g., “Pittsburgh, PA, United States”) on the “About” section of the user profile in a card titled “Location”
6. Navigating to the “Edit Profile” tab allows you to edit this location information and save changes
7. To remove your location, clear all fields in the form and click save changes

## How to Test
1. Visibility tests
     - Verify that the “Add Location” link appears when a user has no saved location
     - Verify that the link disappears when the user has a saved location
2. Input handling
     - Enter a full valid location (city, state, and country) and save, and confirm it displays properly
     - Enter a partial input (just city or just country) and confirm it displays properly formatted
     - Leave all fields blank in the editing screen and confirm the location disappears from the profile
3. Permissions
     - Ensure that only logged-in users can add a location
     - Ensure that an attempt to edit another user’s location through the API fails

## Automated Tests:
- Location: test/users/location.js
- What’s being tested:
     - Inputs are stored as properly formatted location text
     - Invalid inputs are rejects (urls and overly long text), giving clear error messages
     - When an empty string is submitted, the stored value is removed
     - The custom fields can be defined by admins and properly applied to user profiles

Rationale: The automated tests sufficiently cover the feature because:
     - Validation coverage: ensures input sanitization and rejection of unsafe or malformed text
     - Data consistency: confirms normalization of capitalization and safe clearing of fields
     - Error resilience: verifies explicit, descriptive error messages for invalid input
     - Security assurance: ensures users cannot modify others’ location fields

—

# Feature: University Field on Profile

## How to Use
1. Login as admin (or any user)
2. Navigate to profile by clicking on profile picture in top right corner and then clicking on the name at the top of the pop-up menu
3. Click on the “Add University” link in the “About” section of the user profile
4. Fill in the information (university and graduation year) in the pop-up form (partial inputs are allowed) 
5. Press the save button to update the profile
5. Confirm the updated information is reformatted (e.g., “Carnegie Mellon University (‘27)”) on the “About” section of the user profile in a card titled “University”
6. Navigating to the “Edit Profile” tab allows you to edit this university information and save changes
7. To remove your university, clear all fields in the form and click save changes

## How to Test
1. Visibility tests
     - Verify that the “Add University” link appears when a user has no saved university
     - Verify that the link disappears when the user has a saved university
2. Input handling
     - Enter a full valid university (university and graduation year) and save, and confirm it displays properly
     - Enter a partial input (just university or graduation year) and confirm it displays properly formatted
     - Leave all fields blank in the editing screen and confirm the university disappears from the profile
3. Permissions
     - Ensure that only logged-in users can add a university
     - Ensure that an attempt to edit another user’s university through the API fails

## Automated Tests:
- Location: test/users/university.js
- What’s being tested:
     - Inputs are stored as properly formatted university text
     - Invalid inputs are rejects (urls and overly long text), giving clear error messages
     - When an empty string is submitted, the stored value is removed
     - The custom fields can be defined by admins and properly applied to user profiles

Rationale: The automated tests sufficiently cover the feature because:
     - Validation coverage: ensures input sanitization and rejection of unsafe or malformed text
     - Data consistency: confirms normalization of capitalization and safe clearing of fields
     - Error resilience: verifies explicit, descriptive error messages for invalid input
     - Security assurance: ensures users cannot modify others’ university fields

—

# Feature: Pinned Comment

## How to Use
1. Navigate to any post with multiple comments
2. Login as admin or post author
3. Hover over a comment to reveal the “...” dropdown menu
4. Click the “Pin Comment” option to pin that comment to the top of the thread 
5. The pinned comment now appears directly beneath the original post
5. To unpin, repeat the process, selecting “Unpin Comment”

## How to Test
1. Functionality
     - As an admin or post author, verify the pin option appears in the dropdown.
     - Pin a comment and confirm it moves to the top of the thread.
     - Unpin the comment and confirm it returns to its original position.
     - Verify regular users cannot see the pin/unpin option.
     - Check that pin/unpin actions persist after page reloads.
2. Authorization
     - As a regulate user, confirm the “Pin Comment” option is not visible
     - An attempt to call the API directly as a regular user returns an error or does not change the pin state
3. Data consistency
     - Confirm pinned comments still have accurate votes, timestamps, and attachments

## Automated Tests:
- Location: test/posts.js
- What’s being tested:
    - Ensures pinned flag is treated as a boolean.
    - Confirms votes, timestamps, and attachments still compute correctly for pinned posts.
    - Verifies that non-existent post IDs do not cause errors.
    - Ensures parent topic owners can pin/unpin their replies.
    - Validates that loadPostTools correctly sets the canPin permission flag for owners/admins.

Rationale: The automated tests sufficiently cover the feature because:
    - Safety & Stability: No crashes or exceptions when invalid IDs are passed.
    - Permission Control: Only topic owners and admins can pin/unpin.
    - Data Integrity: Pinned status doesn’t disrupt normal post attributes like votes or attachments.
    - User Experience: Confirms pin actions are reflected correctly in UI logic through loadPostTools.
