# MDExpenseTracker

A React Native mobile application built with Expo for tracking personal expenses.

## Running Tests

### Install dependencies

npm install

### Run all tests

npm test

### Run tests with coverage report

npm test -- --coverage

## Test Structure

MDExpenseTracker/
└── tests/
    ├── categoryTotals.test.ts          
    ├── expenses.test.ts                
    ├── location.test.ts                
    ├── imagePicker.test.ts             
    └── integration.addExpenseFlow.test.ts  

## What is Tested

### Unit Tests

**categoryTotals.test.ts**
Tests the `getCategoryTotals` utility function.
- Empty expense list
- Single and multiple categories
- Missing category falls back to "Other"
- Decimal amounts
- Case sensitivity

**expenses.test.ts**
Tests the `addExpense` utility function.
- Throws error when user is not logged in
- Saves correct data to Firestore
- Handles optional fields (location, image, notes)
- Propagates Firestore errors

**location.test.ts**
Tests the `getCurrentLocation` utility function.
- Throws when permission is denied
- Returns correct coordinates
- Builds location name from district, subregion or street
- Requests high accuracy GPS

**imagePicker.test.ts**
Tests the `pickImage` and `takePhoto` utility functions.
- Throws when permission is denied
- Returns null when user cancels
- Returns correct image URI
- Verifies correct launch options

### Integration Tests

**integration.addExpenseFlow.test.ts**
Tests the full add expense workflow across multiple utilities.
- Complete flow: location → image → save expense
- Auth guard blocks unauthenticated saves
- Expense saves without location when permission denied
- Expense saves without image when user cancels
- Multiple expenses saved in same session
- Firestore failure handled mid-flow

## Why Mocking is Used

All external dependencies are mocked in tests:

- **Firebase/Firestore** — prevents real database writes
- **AsyncStorage** — prevents real device storage access
- **expo-location** — prevents real GPS hardware access
- **expo-image-picker** — prevents real camera/gallery access

This ensures tests are fast, reliable and run on any machine
including CI/CD servers with no phone hardware.

## Test Results

All 45 tests pass across 5 test suites.
```
PASS  tests/categoryTotals.test.ts
PASS  tests/expenses.test.ts
PASS  tests/imagePicker.test.ts
PASS  tests/integration.addExpenseFlow.test.ts
PASS  tests/location.test.ts

Tests: 45 passed, 45 total
Test Suites: 5 passed, 5 total
```