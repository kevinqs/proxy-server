let http = require('http')
let request = require('request')
let fs = require('fs')
let through = require('through')
let argv =require('yargs')
	.default('host', '127.0.0.1')
	.argv
let scheme = 'http://'
let port = argv.port || argv.host === '127.0.0.1' ?
	8000 : 80	
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

http.createServer((req, res) => {
	logStream.write('\nEcho request: \n' + JSON.stringify(req.headers))
	for (let header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	through(req, logStream, {autoDestory: false})
	req.pipe(logStream)
	req.pipe(res)
}).listen(8000)

logStream.write('Listening at http://127.0.0.1:8000')

http.createServer((req, res) => {
	let url = destinationUrl
	if (req.headers['x-destination-rul']) {
		url = req.headers['x-destination-url']
	}

	logStream.write('\nProxy request: \n ' + JSON.stringify(req.headers))
	req.pipe(process.stdout)
	let options = {
		headers: req.headers,
		url: url + req.url
	}
	let destinationResponse = req.pipe(request(options))
	logStream.write(JSON.stringify(destinationResponse.headers))
	destinationResponse.pipe(res)
}).listen(8001)