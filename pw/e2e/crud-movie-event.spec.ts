import { test, expect } from '../support/fixtures'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'
import { recurseWithExpect } from '../support/utils/recurse-with-expect'
import { runCommand } from '../support/utils/run-command'
import { parseKafkaEvent } from '../support/parse-kafka-event'
import { Movie } from '@prisma/client'

test.describe('CRUD movie with events', () => {
  let token: string
  const movie = generateMovieWithoutId()
  let updatedMovie = generateMovieWithoutId()

  const movieProps: Omit<Movie, 'id'> = {
    ...movie
  }

  const movieEventProps = {
    name: expect.any(String),
    year: expect.any(Number),
    rating: expect.any(Number),
    director: expect.any(String)
  }

  test.beforeAll('should get a token with helper', async ({ apiRequest }) => {
    // Check if Kafka is running, otherwise skip test
    const responseCode = runCommand(
      `curl -s -o /dev/null -w "%{http_code}" ${process.env.KAFKA_UI_URL}`
    )
    if (responseCode !== '200') {
      test.skip()
    }
    const {
      body: { token: fetchedToken }
    } = await apiRequest<{ token: string }>({
      method: 'GET',
      url: 'auth/fake-token'
    })
    token = fetchedToken
  })

  test('should crud with events', async ({
    addMovie,
    getAllMovies,
    getMovieById,
    getMovieByName,
    updateMovie,
    deleteMovie
  }) => {
    // add a movie
    const { body: createResponse, status: createStatus } = await addMovie(
      token,
      movie
    )
    expect(createStatus).toBe(200)
    expect(createResponse).toMatchObject({ status: 200, data: movieProps })

    const movieId = createResponse.data.id

    // get all movies and verify that the movie exists
    const { body: getAllResponse, status: getAllStatus } =
      await getAllMovies(token)
    expect(getAllStatus).toBe(200)
    expect(getAllResponse).toMatchObject({
      status: 200,
      data: expect.arrayContaining([expect.objectContaining({ id: movieId })])
    })
    // Wait for 'movie-created' Kafka event using recurseWithExpect
    await recurseWithExpect(
      async () => {
        const topic = 'movie-created'
        const event = await parseKafkaEvent(movieId, topic)

        // Performing assertions on the event content
        expect(event).toEqual([
          {
            topic,
            key: movieId.toString(),
            movie: {
              id: movieId,
              ...movieProps
            }
          }
        ])
      },
      { interval: 5000 }
    )

    // get movie by id
    const { body: getByIdResponse, status: getByIdStatus } = await getMovieById(
      token,
      movieId
    )
    expect(getByIdStatus).toBe(200)
    expect(getByIdResponse).toMatchObject({
      status: 200,
      data: { ...movieProps, id: movieId }
    })

    // get movie by name
    const { body: getByNameResponse, status: getByNameStatus } =
      await getMovieByName(token, movie.name)
    expect(getByNameStatus).toBe(200)
    expect(getByNameResponse).toMatchObject({
      status: 200,
      data: { ...movieProps, id: movieId }
    })

    // update movie
    const { body: updateBody, status: updateStatus } = await updateMovie(
      token,
      movieId,
      updatedMovie
    )
    expect(updateStatus).toBe(200)
    expect(updateBody).toMatchObject({
      status: 200,
      data: { ...updatedMovie, id: movieId }
    })

    await recurseWithExpect(
      async () => {
        const topic = 'movie-updated'
        const event = await parseKafkaEvent(movieId, topic)

        expect(event).toEqual([
          {
            topic,
            key: movieId.toString(),
            movie: { ...updatedMovie, id: movieId }
          }
        ])
      },
      { interval: 5000 }
    )

    // delete movie
    const { status: deleteStatus, body: deleteBody } = await deleteMovie(
      token,
      movieId
    )
    expect(deleteStatus).toBe(200)
    expect(deleteBody).toMatchObject({
      status: 200,
      message: expect.any(String)
    })

    await recurseWithExpect(
      async () => {
        const topic = 'movie-deleted'
        const event = await parseKafkaEvent(movieId, topic)

        expect(event).toEqual([
          {
            topic,
            key: movieId.toString(),
            movie: { ...updatedMovie, id: movieId }
          }
        ])
      },
      { interval: 5000 }
    )

    // Verify the movie no longer exists
    const { body: allMoviesAfterDelete } = await getAllMovies(token)
    expect(allMoviesAfterDelete).toMatchObject({
      status: 200,
      data: expect.not.arrayContaining([
        expect.objectContaining({ id: movieId })
      ])
    })

    // Attempt to delete non existing movie
    const { status: deleteNonExistentStatus, body: deleteNonExistentResponse } =
      await deleteMovie(token, movieId)
    expect(deleteNonExistentStatus).toBe(404)
    expect(deleteNonExistentResponse).toMatchObject({
      status: 404,
      error: expect.stringContaining(movieId.toString())
    })
  })
})
