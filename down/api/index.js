const express = require("express")
const morgan = require("morgan")
const cors = require('cors')
const { connection } = require("./api/db")
const routes = require("./api/routes")
const { runSystemCheckLoop } = require("./api/main/statusCheck")
const app = express()
const path = require('path')
const fs = require('fs')
const { htmlBuildingTemplate } = require("./api/templates/buildingTemplate")

const PORT = process.env.PORT || 5000

app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}))
app.use(morgan("dev"))

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000 }));

app.use("/api", routes)

app.use((err, _, res, __) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

const buildPath = path.resolve(__dirname, '..', 'client', 'build') || ''
const indexHtmlPath = buildPath ? path.resolve(buildPath, 'index.html') : ''
const indexExists = buildPath && indexHtmlPath && fs.existsSync(indexHtmlPath)

if (process.env.NODE_ENV === 'production' && indexExists) {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')))
  app.get('*', (_, res) => {
    res.sendFile(indexHtmlPath, (err) => {
      if (err) {
        console.error('Building app...', err)
        res.status(500).send(htmlBuildingTemplate)
      }
    })
  })
}

app.get('/', (_, res) => {
  res.status(200).send('DownDetector API [Status: OK]')
})

connection.on("error", console.error.bind("Connection error: ", console))

connection.once("open", () => {
  app.listen(PORT, () => console.log(`Server listening on Port: ${PORT}...`))
  runSystemCheckLoop(60000)
})


module.exports = app