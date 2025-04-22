import { test as base, mergeTests } from '@playwright/test'
import { test as apiRequestFixture } from './fixtures/api-request-fixture'

// Merge fixtures
const test = mergeTests(apiRequestFixture)

const expect = base.expect

export { test, expect }
