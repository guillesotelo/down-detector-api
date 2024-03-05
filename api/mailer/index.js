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
  await transporter.sendMail({
    from: `"{process.env.APP_NAME}" <hpdevp@company.com>`,
    to,
    subject,
    html: data.html
  }).catch((err) => {
    console.error('Nodemailer (Send) error', err)
  })
}

module.exports = {
  transporter,
  sendEmail,
}