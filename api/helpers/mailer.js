const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// transporter.verify().then(() => {
//   console.log("* Mailing ready *")
// }).catch((err) => {
//   console.error('Nodemailer error', err)
// })

const sendEmail = async (data, to, subject) => {
  await transporter.sendMail({
    from: `"{process.env.APP_NAME}" <${process.env.EMAIL}>`,
    to,
    subject,
    html: data
  }).catch((err) => {
    console.error('Nodemailer (Send) error', err)
  })
}

module.exports = {
  transporter,
  sendEmail,
}