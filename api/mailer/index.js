const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail'
})

// transporter.verify().then(() => {
//   console.log("* Mailing ready *")
// }).catch((err) => {
//   console.error('Nodemailer error', err)
// })

const sendEmail = async (data, to, subject) => {
  const tData = await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.APP_EMAIL}>`,
    to,
    subject,
    html: data.html
  }).catch((err) => {
    console.error('Nodemailer (Send) error', err)
  })

  if (tData) {
    console.log(`*** Mail sent successfully: `, JSON.stringify(tData))
    return tData
  }
  else return null
}

module.exports = {
  transporter,
  sendEmail,
}