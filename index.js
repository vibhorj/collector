/*
Business Source License 1.1
Parameters
Licensor:             Robert Sahlin
Licensed Work:        StreamProcessor
                      The Licensed Work is (c) 2020 Robert Sahlin.
Additional Use Grant: You may use the Licensed Work when the Licensed Work is 
                      processing less than 10 Million events per month, 
                      provided that you do not use the Licensed Work for a 
                      commercial offering that allows third parties to access
                      the functionality of the Licensed Work so that such third
                      parties directly benefit from the features of the Licensed Work.
Change Date:          12 months after code release (major or minor semantic version upgrade)
Change License:       GNU AFFERO GENERAL PUBLIC LICENSE, Version 3
Please contact the licensor if you need a license for use not covered by the additional use grant.
*/

'use strict';

// imports
const {PubSub} = require('@google-cloud/pubsub');
const uuidv4 = require('uuid/v4');
const express = require('express');
var cors = require('cors');

const apiKeys = process.env.API_KEYS;
const allowOrigins = process.env.ALLOW_ORIGINS;
const pubsub = new PubSub();

// CORS
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    const origin = req.header('Origin');
    if ((allowOrigins != undefined && allowOrigins.split(',').indexOf(origin) !== -1) || // client request -> check allowed origins
        (!origin && apiKeys != undefined && apiKeys.split(',').indexOf(req.query.api_key) !== -1)) { // server request -> check api_key
            corsOptions = { origin: true }
            console.log('CORS');
            callback(null, corsOptions)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
}

// Create an Express object and routes (in order)
const app = express();
app.set('trust proxy', true);
app.options('*', cors(corsOptionsDelegate)); // Pre-flight
app.post('/namespace/:namespace/name/:name', cors(corsOptionsDelegate), apiPost);
app.get('/headers', cors(corsOptionsDelegate), apiHeaders);
app.get('/keepalive', cors(corsOptionsDelegate), apiKeepAlive);

// Set our GCF handler to our Express app.
exports.collector = app;

async function publish(req, res){
    
    // Pubsub topics to publish message on
    var topic = req.params.namespace.concat('.', req.params.name, '.RAW');
    var topics =[topic];

    // Pubsub message attributes
    var attributes = {
        namespace : req.params.namespace,
        name : req.params.name,
        collectTopic : topic,
        collectTimestamp :  new Date().toISOString(),
        collectUuid : uuidv4()
    };

    // Pubsub message body
    var data = {};
    data.payload = req.body;
    data.headers = req.headers;
    data.queryString = req.query;  
    console.log(data); 
    console.log(attributes);  

    // Publish to topics
    let messageIds = await Promise.all(topics.map(currentTopic => pubsub.topic(currentTopic).publish(Buffer.from(JSON.stringify(data)), attributes)))
    .catch(function(err) {
        console.error(err.message);
        res.status(400).end(`error when publishing data object to pubsub`);
    });
    console.log(messageIds);
}

// Respond with headers
async function apiHeaders(req, res) {
    res.json(req.headers).end()
}

// Schedule requests to this endpoint keep instance warm
async function apiKeepAlive(req, res) {
    res.status(204).end();
}

// Collect request (POST) and publish data on pubsub
async function apiPost(req, res) {
    if(req.params.namespace !== undefined && req.params.name !== undefined){ // Check if required params exist
        await publish(req, res);
        if(!res.headersSent){
            res.status(204).end();
        }
    }else{
        console.error("Path param undefined");
        res.status(400).end('Path param undefined. Pattern should be https://host/namespace/:namespace(*)/name/:name/');    
    }
}