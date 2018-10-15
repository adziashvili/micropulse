    const express = require('express')
    const favicon = require('serve-favicon')
    const morgan = require('morgan')
    const cors = require('cors')
    const serveStatic = require('serve-static')
    const cookieParser = require('cookie-parser')
    const bodyParser = require('body-parser')
    const multer = require('multer')
    const path = require('path')
    const config = require('../../package.json')

    const ROOT = '../../'
    const WWW_FOLDER = path.join(__dirname, ROOT, 'www')
    const UPLOADS_FOLDER = path.join(__dirname, ROOT, 'data', 'uploads')
    const IMAGES_FOLDER = 'images'
    const FAVICON = 'favicon.ico'
    const PORT = 3001

    const storage = multer.diskStorage({
      destination: (req, file, cb) => { cb(null, UPLOADS_FOLDER) },
      filename: (req, file, cb) => { cb(null, file.originalname) }
    })
    const upload = multer({ storage })

    export default class MPServer {
      constructor(mp) {
        this.mp = mp
        this.app = express()
        this.port = PORT
        this.setup()
      }

      setup() {
        const { app } = this

        app.use(morgan((tokens, req, res) => [
          tokens.method(req, res).bold, tokens.url(req, res).bold,
          '=>', tokens.status(req, res),
          tokens.res(req, res, 'content-length'),
          tokens['response-time'](req, res), 'ms'
        ].join(' ')))
        // Set up logger

        app.use(cors())
        app.use(favicon(path.join(WWW_FOLDER, IMAGES_FOLDER, FAVICON)))
        app.use(serveStatic(path.join(WWW_FOLDER)))
        app.use(serveStatic(path.join(WWW_FOLDER, IMAGES_FOLDER)))

        app.use(cookieParser())

        app.use(bodyParser.json())
        // for parsing application/json

        app.use(bodyParser.urlencoded({ extended: true }))
        // for parsing application/x-www-form-urlencoded

        // GET API Endpoints
        // -----------------
        app.get(['/', '/whoami'], (req, res) => res.send(this.whoami()))
        app.get('/version', (req, res) => res.send(config.version))
        app.get('/practices', (req, res) => res.send(this.mp.pm.pdb))

        // API Endpoints POST
        // ------------------
        app.post('/upload', upload.single('file'), (req, res) => {
          const { size, originalname } = req.file
          const uploadDetails = `Recieved ${originalname} ${Math.round(size / 1024)}kb`
          console.log(uploadDetails)
          res.json(uploadDetails);
        })
      }

      start() {
        const { app, port } = this
        app.listen(port)
        this.log(this.whoami())
      }

      log(msg = '') {
        console.log(msg)
      }

      whoami() {
        const {
          name,
          version,
          description
        } = config
        return `${name} (v${version}) ${description} running on port ${this.port}`
      }
    }
