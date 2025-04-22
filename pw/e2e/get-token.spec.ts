import { test, expect } from '../support/fixtures';

test.describe('token acquisition', (): void => {
    test('should get a token', async ({request}): Promise<void>  => {
        const tokenRes= await request.get('/auth/fake-token')
    })
})
