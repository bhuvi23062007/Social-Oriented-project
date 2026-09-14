import CreditsCard from '../../components/CreditsCard'
import { useCredits } from '../../hooks/useCredits'

function CleanerCredits() {
  const { balance, history } = useCredits('cleaner')
  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Credits</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Your Credits</h1>
        <p className="text-muted text-sm mt-1">Earned automatically when admin verifies your completed pickups</p>
      </div>
      <CreditsCard balance={balance} history={history} label="Total Credits Earned" />
    </div>
  )
}

export default CleanerCredits