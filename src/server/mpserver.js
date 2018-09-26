const express = require('express')
const favicon = require('serve-favicon')
const morgan = require('morgan')
const cors = require('cors')
const serveStatic = require('serve-static')
const path = require('path')
const config = require('../../package.json')

const ROOT = '../../'

export default class MPServer {
  constructor() {
    this.app = express()
    this.port = 3000
    this.www = path.join(__dirname, ROOT, 'www')
    this.setup()
  }

  setup() {
    const { app } = this

    // Middlewares
    app.use(morgan('tiny'))
    app.use(cors())
    app.use(favicon(path.join(this.www, 'images', 'favicon.ico')))
    app.use(serveStatic(path.join(this.www)))
    app.use(serveStatic(path.join(this.www, 'images')))

    // Services
    app.get(['/', '/whoami'], (req, res) => res.send(this.whoami()))
    app.get('/version', (req, res) => res.send(config.version))
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
