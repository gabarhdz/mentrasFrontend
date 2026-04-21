import { useEffect } from 'react'

const Profile = () => {
    useEffect(() => {
        const idUser = localStorage.getItem('idUser')
        if (!idUser) {
            window.location.href = '/auth'
        }
    }, [])
  return (
    <>

    </>
  )
}

export default Profile
