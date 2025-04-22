import { test as base, mergeTests } from '@playwright/test'

// Merge fixtures
const test = mergeTests(base)

const expect = base.expect

export { test, expect }
