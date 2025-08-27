
/**
 * Add a track to the queue
 * @param accessToken - The access token for the user, assumed to be valid and not expired
 * @param trackId - The ID of the track to add to the queue
 */
export async function addToQueue(
    accessToken: string,
    trackId: string,
  ): Promise<void> {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to add to queue: ${
          response.statusText
        }. Response: ${await response.text()}`,
      );
    }
  }