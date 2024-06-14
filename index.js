 const fs = require('fs')
 const config = JSON.parse(fs.readFileSync("./usercfg/config.json"));
    const tls = require('tls');
    const https = require('https')
    const express = require('express');
const { Console } = require('console');

    const app = express()

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.text({ type: "text/xml" }));
    
    app.use((req, res, next) => {
        // Log request
        console.log(`${req.method} ${req.url}`);
        // Next
        next();
    });
    
    let agoraServer = https.createServer({
        key: fs.readFileSync("./usercfg/ssl/ca_key.pem"),
        cert: fs.readFileSync("./usercfg/ssl/ca_cert.pem"),
        ciphers: "DEFAULT:@SECLEVEL=0",
        secureProtocol: 'TLSv1_server_method',
       requestCert: false,
        rejectUnauthorized: false   
    }, app);

    let listening = agoraServer.listen(443, () => {
            console.log(`listening on port 443`);
    });
    listening.on("tlsClientError", err => {
            console.error(err);
    });
    
    listening.on('request', (request, response) => {
        let body = [];
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
    
        console.log(`==== ${request.method} ${request.url}`);
        console.log('> Headers');
            console.log(request.headers);
    
        console.log('> Body');
        console.log(body);
            response.end();
        });
    });

    agoraServer.on('secureConnection', (socket) => {
        socket.on('data', (data) => {
            console.log('Received data:', data.toString());
        });
    
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
    
        socket.on('end', () => {
            console.log('Connection ended');
        });
    });

    //handling requests

    app.get('/4680026983694983987/feed/get_channels_by_owner/:id', (req, res) => {
        const id = req.params.id
        AgoraInteraction(req, res, id)
    })

    app.get('/4680026983694983987/profile/get_by_platform_account_id/:accountId', (req,res) => {
        const accountId = req.params.accountId
        GetByPlatformAccountId(req,res,accountId)
    })

    app.get('/4680026983694983987/profile/create', (req,res) => {
        console.log("Attempting to create profile")
    })

    function GetByPlatformAccountId(req,res,accountId){
        console.log("Profile: Get By PlatformAccountId: " + accountId)
        return;
    }


    function AgoraInteraction(req, res, id) {
        console.log(`Agora called! id: ${id}`);
        //res.send('GangsEndpoint response');

        switch(id.toString()){
            case "6":
                console.log("Gangs was called");
                break;
            case "15":
                console.log("Attempting to read EULA")
                break;
            case "16":
                console.log("Attempting to read Terms of Service")
                break;
            case "17":
                console.log("Attempting to read Privacy Policy")
                break;
            default:
                console.log("Unable to read order Id");
        }
    }