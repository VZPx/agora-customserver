 const fs = require('fs')
 const config = JSON.parse(fs.readFileSync("./usercfg/config.json"));
    const tls = require('tls');
    
    let tlsServer = tls.createServer({
        key: fs.readFileSync("./usercfg/ssl/ca_key.pem"),
        cert: fs.readFileSync("./usercfg/ssl/ca_cert.pem"),
        ciphers: "DEFAULT:@SECLEVEL=0",
        secureProtocol: 'TLSv1_server_method',
       requestCert: false,
        rejectUnauthorized: false   
    });
    let listening = tlsServer.listen(443, () => {
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

    tlsServer.on('secureConnection', (socket) => {
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