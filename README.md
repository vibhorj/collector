# collector
Collect events from server or client.

The collector is built with node.js and the functions framework to enable the same code to run on different services, i.e. cloud functions and cloud run. The difference between running your collector on cloud functions and cloud run is:
- Cloud Run supports custom domains, which is needed if you want to set up server side cookies and extend the cookie lifetime due to Safari ITP.
- Cloud Functions add geo data in the header (Cloud Run doesn't) that are required if you want geo data in the events, i.e. in google analytics that is country, region, city, lat and long.

It is possible to run both at the same time and combine them to get the benefits from both.