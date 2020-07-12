# collector
Collect events from server or client.

The collector is built with node.js and the functions framework to enable the same code to run on different services, i.e. cloud functions and cloud run. The difference between running your collector on cloud functions and cloud run is:
- Cloud Run supports custom domains, which is needed if you want to set up server side cookies and extend the cookie lifetime due to Safari ITP.
- Cloud Functions add geo data in the header (Cloud Run doesn't) that are required if you want geo data in the events, i.e. in google analytics that is country, region, city, lat and long.

It is possible to run both at the same time and combine them to get the benefits from both.

# Deploy Cloud Functions from shell

## allow all origins and server side calls with query parameter api_key=123  
gcloud functions deploy collector --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars API_KEYS=123,ALLOW_ORIGINS=*

## allow client calls from origin https://streamprocessor.org and server side calls with query parameter api_key=123
gcloud functions deploy collector --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars API_KEYS=123,ALLOW_ORIGINS=https://streamprocessor.org

# Test locally

npm install

## configure variables
export ALLOW_ORIGINS=*
export API_KEYS=123

npm start

## collect event
curl localhost:8080/namespace/com.google.analytics.v2/name/Event

## return headers (ip etc.)
curl localhost:8080/headers

## keep instance warm
curl localhost:8080/keepalive

## set cookies
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"name": "testCookie", "value": "testValue", "options": {"domain": "domain", "maxAge": 6000}}' \
  http://localhost:8080/cookies