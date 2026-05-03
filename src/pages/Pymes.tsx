import Header from '@/components/ui/Header'
import TitleCard from '@/components/pymes/title-card'
import Footer from '@/components/ui/Footer'
import PymeFeatures from '@/components/pymes/pyme-features'
import PymeDashboard from '@/components/pymes/pyme-dashboard'
export default function Pymes() {
  return (
    <>
    <Header />
    <main className="relative min-h-screen text-foreground"> 
      <TitleCard />
      <PymeFeatures />
      <PymeDashboard />
    </main>
    <Footer />
    </>
    
  )
}
