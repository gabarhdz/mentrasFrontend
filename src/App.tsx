import { useEffect, useState } from 'react'

function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)

    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <>  
    </>
  )
}

export default App
