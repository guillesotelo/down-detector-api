const express = require("express")
const morgan = require("morgan")
const cors = require('cors')
const { connection } = require("./api/db")
const routes = require("./api/routes")
const { runSystemCheckLoop } = require("./api/helpers/statusCheck")
const app = express()

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

const PORT = process.env.PORT || 5000

if(process.env.NODE_ENV === 'production') {
  app.use(express.static('build'))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
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