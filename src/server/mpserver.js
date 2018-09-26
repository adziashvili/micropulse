const express = require('express')
const favicon = require('serve-favicon')
const morgan = require('morgan')
const cors = require('cors')
const serveStatic = require('serve-static')
const path = require('path')
const config = require('../../package.json')

const ROOT = '../../'
const WWW_FOLDER = path.join(__dirname, ROOT, 'www')
const IMAGES_FOLDER = 'images'
const FAVICON = 'favicon.ico'
const PORT = 3000

export default class MPServer {
  constructor(mp) {
    this.mp = mp
    this.app = express()
    this.port = PORT
    this.setup()
  }

  setup() {
    const { app } = this

    // Middlewares
    app.use(morgan('tiny'))
    app.use(cors())
    app.use(favicon(path.join(WWW_FOLDER, IMAGES_FOLDER, FAVICON)))
    app.use(serveStatic(path.join(WWW_FOLDER)))
    app.use(serveStatic(path.join(WWW_FOLDER, IMAGES_FOLDER)))

    // Services
    app.get(['/', '/whoami'], (req, res) => res.send(this.whoami()))
    app.get('/version', (req, res) => res.send(config.version))
    app.get('/practices', (req, res) => res.send(this.mp.pm.pdb))
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
