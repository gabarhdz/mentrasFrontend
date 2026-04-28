const TitleCard = () => {
  return (
    <section className="mx-auto mt-8 w-full max-w-5xl rounded-2xl bg-background px-6 py-10 md:mt-10 md:px-8 md:py-14">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Pymes</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Tus pymes</h1>
        <p className="mt-3 max-w-2xl text-base text-foreground/75 md:text-lg">
          En esta sección puedes ver todas tus pymes registradas y también crear nuevas para
          organizar mejor tu información.
        </p>
    </section>
  )
}

export default TitleCard
