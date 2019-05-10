const axios = require(`axios`)
const httpExceptionHandler = require(`./http-exception-handler`)

/**
 * High-level function to coordinate fetching data from eventbrite.com
 * @param {string} organizationId - The organizationId of the eventbrite account
 * @param {string} accessToken - The access token for eventbrite.com
 * @param {string} entity - The endpoint to fetch
 */
async function fetch({ organizationId, accessToken, entity }) {
  console.log(`Fetch Eventbrite data for '${entity}' entity`)
  // Fetch events from the user (paginated, 50 per page)
  // TODO Implement other URI's
  const fetchResults = {
    [entity]: [],
  };

  let continueFetching = true;
  let page = 1;

  while (continueFetching) {
    try{
      let result = await axios({
        method: `get`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:51.0) Gecko/20100101 Firefox/51.0',
        },
        url: `https://www.eventbriteapi.com/v3/organizations/${organizationId}/${entity}?token=${accessToken}&page=${page}`,
      });

      // only if we're looking at event entites
      if (entity === 'events') { 
        // for each event
        result.data['events'].forEach(res => {
          let eventId = res.id;
          try {
            const descrResult = await axios({ // fetch full description
              method: `get`,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:51.0) Gecko/20100101 Firefox/51.0',
              },
              url: `https://www.eventbriteapi.com/v3/events/${eventId}/description?token=${accessToken}`,
            });
      
            result.data['events'][res].description = descrResult.description; // and place in results
          } catch(e) {
            httpExceptionHandler(e);
          }
        })
      }

      fetchResults[entity] = fetchResults[entity].concat(result.data[entity]);
      
      page += 1;
      continueFetching = result.data.pagination.has_more_items;
    } catch(e) {
      httpExceptionHandler(e);
    }
  }

  return fetchResults;
}
module.exports = fetch
