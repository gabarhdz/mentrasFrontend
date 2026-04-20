import { useState } from 'react'

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)

  const toggleForm = () => {
    setIsLogin(!isLogin)
  }

  return (
    <div className="max-w-md mx-auto relative overflow-hidden z-10 bg-card border border-border p-8 rounded-lg shadow-md before:w-24 before:h-24 before:absolute before:bg-primary/30 before:rounded-full before:-z-10 before:blur-2xl after:w-32 after:h-32 after:absolute after:bg-primary/25 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12">
      <h2 className="text-2xl text-foreground font-bold mb-6">
        {isLogin ? 'Inicia sesion en Mentras' : 'Crea tu cuenta en Mentras'}
      </h2>
      <form method="post" action="#">
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground" htmlFor="username">Username</label>
          <input
            className="mt-1 p-2 w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            name="username"
            id="username"
            type="text"
          />
        </div>
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="email">Email</label>
            <input
              className="mt-1 p-2 w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              name="email"
              id="email"
              type="email"
            />
          </div>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground" htmlFor="password">Contrasena</label>
          <input
            className="mt-1 p-2 w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            name="password"
            id="password"
            type="password"
          />
        </div>
        {!isLogin && (
            <>
            <div className="mb-6">
                <label htmlFor="profile-pic" className="block text-sm font-medium text-muted-foreground">
                  Foto de perfil
                </label>
                <input
                  className="mt-1 p-2 w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  name="profile-pic"
                  id="profile-pic"
                  type="file"
                    accept="image/*"
                    
                />
              </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="confirm-password">Confirmar contrasena</label>
            <input
              className="mt-1 p-2 w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              name="confirm-password"
              id="confirm-password"
              type="password"
            />
          </div>
            </>
        )}
        <div className="flex justify-end">
          <button className="bg-primary text-primary-foreground px-4 py-2 font-bold rounded-md transition-colors hover:bg-accent hover:text-accent-foreground" type="submit">
            {isLogin ? 'Iniciar sesion' : 'Registrarme'}
          </button>
        </div>
        <div className="mt-4 text-center">
          <button
            className="text-sm font-medium text-primary transition-colors hover:text-accent"
            onClick={toggleForm}
            type="button"
          >
            {isLogin ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AuthForm
