 const fs = require('fs')
 const config = JSON.parse(fs.readFileSync("./usercfg/config.json"));
    const tls = require('tls');
    const https = require('https')
    const bodyParser = require('body-parser')
    const express = require('express');
    const { StreamUtils, ReadableStreamBuffer, WritableStreamBuffer } = require('./StreamUtils'); 
    const url = require('url');
 const binPacker2 = require('./binaryPacker2')
 const ChunkStream = require('./chunkStream')

const { Console } = require('console');
const BinaryPacker2 = require('./binaryPacker2');

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

const platformAccountId = null

const AG_NONE_TYPE = 1;
const AG_INT32_TYPE = 2;
const AG_BINARY_TYPE = 3;
const AG_BOOL_TYPE = 4;
const AG_UBYTE_TYPE = 5;
const AG_FLOAT64_TYPE = 6;
const AG_DATETIME_TYPE = 7;
const AG_ARRAY_TYPE = 8;
const AG_STRUCT_TYPE = 9;
const AG_INT64_TYPE = 10;
const AG_BITSTRUCT_TYPE = 11;
const AG_HASHMAP_TYPE = 12;
const AG_UINT64_TYPE = 13;
const AG_UTF8STRING_TYPE = 14;

const agoraColor = '\x1b[37;46m%s\x1b[0m'

function LogServer(reqres) {
    // Is request or response?
    const isRequest = reqres.hasOwnProperty("method");
    // Log to console
    console.log(`${isRequest ? reqres.method : reqres.statusMessage} ${isRequest ? reqres.url : reqres.statusCode}`);
}
    
    let agoraServer = https.createServer({
        key: fs.readFileSync("./usercfg/ssl/ca_key.pem"),
        cert: fs.readFileSync("./usercfg/ssl/ca_cert.pem"),
        ciphers: "DEFAULT:@SECLEVEL=0",
        secureProtocol: 'TLSv1_server_method',
       requestCert: false,
        rejectUnauthorized: false   
        
    }, app,(req,res) => {
        let data = [];
      
        req.on('data', chunk => {
          data.push(chunk);
        });
      
        req.on('end', () => {
          // Concatenate all chunks into a single buffer
          let buffer = Buffer.concat(data);
      
          // Log if the incoming data is a buffer
          if (Buffer.isBuffer(buffer)) {
            console.log(agoraColor, ('Received buffer:', buffer));
          } else {
            console.log('Received data is not a buffer');
          }
      
          // Respond to the client
          //res.writeHead(200, {'Content-Type': 'text/plain'});
          //res.end('Data received');
        });
      
      });

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
        platformAccountId = req.params.accountId
        console.log(agoraColor, "Profile: Get By PlatformAccountId: " + accountId)
    })

    app.get('/4680026983694983987/profile/create', (req,res) => {
        console.log(agoraColor, "Attempting to create profile")
    })

    app.post('/4680026983694983987/profile/convert_platform_account_ids_to_guids', (req,res) => {
        console.log(agoraColor, "Converting steam friends to GUID list")
    })


    function generateRandomBuffer() {
        const size = 1; // Adjust the size as needed
        const buffer = Buffer.alloc(size);
        buffer.fill(Math.floor(Math.random() * 256)); // Fill buffer with random data
        return buffer;
    }

    function AgoraInteraction(req, res, id) {
        console.log(`Agora called! id: ${id}`);
        //res.send('GangsEndpoint response');

        switch(id.toString()){
            case "6":
                LogServer(req);
                var buf = Buffer.alloc(3)
                buf.write("0x02")
            console.log(agoraColor, "Gangs was called");
            res.end(buf)
            LogServer(res)
            break;
            case "15":
                console.log(agoraColor, "Attempting to read EULA")
                break;
            case "16":
                console.log(agoraColor, "Attempting to read Terms of Service")
                break;
            case "17":
                console.log(agoraColor, "Attempting to read Privacy Policy")
                break;
            default:
                console.log(agoraColor, "Unable to read order Id");
        }
    }


    //////////////////////////////////



