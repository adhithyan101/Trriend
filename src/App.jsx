import { useState } from 'react'
import Home from './pages/Home'
import ReportRequest from './pages/ReportRequest'
import OfferHelp from './pages/OfferHelp'
import GetStarted from './pages/GetStarted'

function App() {
  const [page, setPage] = useState('home')

  if (page === 'report') {
    return (
      <ReportRequest onBack={() => setPage('home')} />
    )
  }

  if (page === 'offer') {
    return (
      <OfferHelp onBack={() => setPage('home')} />
    )
  }

  if (page === 'get-started') {
    return (
      <GetStarted
        onBack={() => setPage('home')}
        onNeedHelp={() => setPage('report')}
        onOfferHelp={() => setPage('offer')}
      />
    )
  }

  return (
    <Home
      onReport={() => setPage('report')}
      onOffer={() => setPage('offer')}
      onGetStarted={() => setPage('get-started')}
    />
  )
}

export default App