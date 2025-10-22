import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../AppContext"
import { getVersionDate } from "../../services"
import { APP_VERSION, days, months } from "../../constants/app"

export default function Help() {
  const { isLoggedIn } = useContext(AppContext)
  const [versionDate, setVersionDate] = useState('')

  useEffect(() => {
    getTooltipVersionDate()
  }, [])

  const getTooltipVersionDate = async () => {
    try {
      const vDate = await getVersionDate()
      if (vDate) {
        const date = new Date(vDate)
        const number = date.getDate()
        const letters = number === 1 ? 'st' : number === 2 ? 'nd' : 'th'
        const day = days[date.getDay() - 1]
        const month = months[date.getMonth()]
        const year = date.getFullYear()

        setVersionDate(`${day} ${number}${letters} of ${month}, ${year} [${APP_VERSION}]`)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="about__container" style={{ width: isLoggedIn ? '85vw' : '' }}>
      <div className="about__section">
        <h1 className="page__header-title">About {process.env.APP_NAME}</h1>
        <h2 className="about__title">Process Overview</h2>
        <p className="about__text">
          Our system status monitoring process oversees the availability of some selected internal company systems. This comprehensive solution involves real-time checks, user reports, and planned downtime management.
        </p>
        <h3 className="about__subtitle">1. System Discovery and Configuration</h3>
        <p className="about__text">
          The process begins by gathering information about all internal systems along with their custom configurations.
        </p>
        <h3 className="about__subtitle">2. Real-time Status Checks</h3>
        <p className="about__text">
          For each system, a dedicated function runs at specific intervals to assess its status. This function examines different response types and data to determine if the system is operating as expected. Additionally, user reports play a critical role to understand the real status from end users.
        </p>
        <h3 className="about__subtitle">3. Data Storage and History</h3>
        <p className="about__text">
          All status data is stored as historical records, capturing changes and responses. To optimize database space, only the differences between consecutive historical entries are saved.
        </p>
        <h3 className="about__subtitle">4. Live Updates on the Frontend</h3>
        <p className="about__text">
          The application frontend is refreshed every minute, providing users with live data on all systems, historical records, and user reports. This ensures that users have access to the most current information.
        </p>
        <h3 className="about__subtitle">5. Planned Downtime Management</h3>
        <p className="about__text">
          Each system is associated with one or more owners who can schedule planned downtime. This feature allows owners to communicate scheduled maintenance, preventing unexpected disruptions. Users can easily view planned downtime information, distinguishing it from live downtime.
        </p>
        <h3 className="about__subtitle">6. User-Generated Reports</h3>
        <p className="about__text">
          Users have the ability to submit reports detailing issues they encounter with a system. These reports, categorized by issue type and comments, trigger a threshold mechanism. When a number of users have reported a system as <i>down</i>, it is flagged as <i>"reportedly down"</i>.
        </p>
        <h3 className="about__subtitle">7. Dashboard Insights</h3>
        <p className="about__text">
          The Dashboard serves as a centralized hub where users can access a snapshot of system data from the last 24 hours. Clicking on a system card provides a detailed breakdown, including a graph illustrating performance trends, the current status, and  Subscribe and Report buttons for user interactions.
        </p>
        <h3 className="about__subtitle">&nbsp;</h3>
        <p className="about__text">
          Our system status monitoring process is designed to provide users with a general view of internal systems' health and performance. By performing real-time checks, user reports, and planned downtime management, we ensure transparency and help users to make informed decisions.
        </p>
        <h3 className="about__subtitle">&nbsp;</h3>
        <h3 className="about__subtitle">Feedback and Contact Information</h3>
        <p className="about__text">
          We value your feedback, suggestions, and any concerns you may have regarding the system status monitoring application.
          <br />The Stargate team is here to assist you and welcomes your input to improve the developer experience.
        </p>
        <h4 className="about__subtitle">Stargate Team</h4>
        94530 HP System Architecture
        <p className="about__text"><a href="mailto:hpdevp@company.com">hpdevp@company.com</a></p>
        <p><i>Last app update: {versionDate}</i></p>
      </div>
    </div>
  )
}