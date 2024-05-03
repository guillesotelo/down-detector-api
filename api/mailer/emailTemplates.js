const { downLogoBase64WLow } = require("../templates/down-logo-base64")

const getDownTimeString = (totalMinutes) => {
    if (!totalMinutes) return '3 minutes'
    const hours = Math.floor(totalMinutes / 60) > 0 ? Math.floor(totalMinutes / 60) : 0
    const minutes = hours ? Math.floor(((totalMinutes / 60) - hours) * 60) : totalMinutes
    return hours ?
        `${hours} ${hours > 1 ? 'hours' : 'hour'} and ${minutes} minutes`
        : `${minutes} minutes`
}

const systemDown = (data) => `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" http://www.w3.org/TR/html4/loose.dtd>

<html>

<head>



    <title>{process.env.APP_NAME}</title>

</head>

<body style="font-family: Arial, sans-serif">



    <table style="border: 0; padding: 0; width: 800px">

        <tr style="background-color:#1b365d; padding: 0;vertical-align: middle;" height=80>

            <td colspan=3>

                <div style="text-align: center;">

                    <img alt="{process.env.APP_NAME}" loading="lazy" width=140 height=48 src=${downLogoBase64WLow}
                    />

                </div>

            </td>

        </tr>

        <tr>

            <td width=30px>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>

            <td>

                <div style="font-weight: 400; line-height: 140%; text-align: left; word-wrap: break-word;line-height: 140%; color: #666666">

                    <div style="font-size: 10px"> &nbsp;</div>

                    <p style="font-size: 20px">Hi ${data.owner},</p>

                    <p style="font-size: 18px">{process.env.APP_NAME} has detected that the system ${data.name} has been consistently marked as <span style="color: red;">down</span> for over ${getDownTimeString(data.timePassedFromDown)}.</p>

                    <p style="font-size: 18px;margin: 1.4rem 0 0 0;">You are receiving this message because your account is associated with this system. This is just an informational message, and no action is required from you.</p>

                    <p style="font-size: 18px;margin: 1.4rem 0 0 0;">Regards, <br/>Team Stargate.</p>

                    <p style="font-size: 15px;margin: 2rem 0 0 0;">We are here to assist you. If you have any questions or concerns, <a href=mailto:hpdevp@company.com>contact us</a>, or respond directly to this email.</p>
                    <div style="font-size: 10px"> &nbsp;</div>
                </div>

            </td>

            <td width=30px>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>

        </tr>

        <tr>

            <td style="background-color:#1b365d; padding: 0;vertical-align: center;" height=60 colspan=3>

                <div style="color: lightgray; text-align: center;">

                    <a style="color:white; text-decoration: none;" href=https://down.company.com>{process.env.APP_NAME}</a>

                </div>

            </td>

        </tr>

    </table>

</body>

</html>
`

const systemUp = (data) => `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" http://www.w3.org/TR/html4/loose.dtd>

<html>

<head>



    <title>{process.env.APP_NAME}</title>

</head>

<body style="font-family: Arial, sans-serif">



    <table style="border: 0; padding: 0; width: 800px">

        <tr style="background-color:#1b365d; padding: 0;vertical-align: middle;" height=80>

            <td colspan=3>

                <div style="text-align: center;">

                    <img alt="{process.env.APP_NAME}" loading="lazy" width=140 height=48 src=${downLogoBase64WLow}
                    />

                </div>

            </td>

        </tr>

        <tr>

            <td width=30px>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>

            <td>

                <div style="font-weight: 400; line-height: 140%; text-align: left; word-wrap: break-word;line-height: 140%; color: #666666">

                    <div style="font-size: 10px"> &nbsp;</div>

                    <p style="font-size: 20px">Hi ${data.owner},</p>

                    <p style="font-size: 18px">{process.env.APP_NAME} has detected that the system ${data.name} is <span style="color: green;">up</span> again.</p>

                    <p style="font-size: 18px;margin: 1.4rem 0 0 0;">You are receiving this message because your account is associated with this system. This is just an informational message, and no action is required from you.</p>

                    <p style="font-size: 18px;margin: 1.4rem 0 0 0;">Regards, <br/>Team Stargate.</p>

                    <p style="font-size: 15px;margin: 2rem 0 0 0;">We are here to assist you. If you have any questions or concerns, <a href=mailto:hpdevp@company.com>contact us</a>, or respond directly to this email.</p>
                    <div style="font-size: 10px"> &nbsp;</div>
                </div>

            </td>

            <td width=30px>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>

        </tr>

        <tr>

            <td style="background-color:#1b365d; padding: 0;vertical-align: center;" height=60 colspan=3>

                <div style="color: lightgray; text-align: center;">

                    <a style="color:white; text-decoration: none;" href=https://down.company.com>{process.env.APP_NAME}</a>

                </div>

            </td>

        </tr>

    </table>

</body>

</html>
`

module.exports = {
    systemDown,
    systemUp,
}