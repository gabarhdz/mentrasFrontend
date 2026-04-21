import { useEffect } from 'react'
import Footer from '@/components/ui/Footer'

const Profile = () => {
    useEffect(() => {
        const jwt_token = localStorage.getItem('jwt_token') 
        if (!jwt_token) {
            window.location.href = '/auth'
        }
    }, [])
  return (
    <>

    <Footer />
    </>
  )
}

export default Profile
