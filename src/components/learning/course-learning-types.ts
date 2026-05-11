export type LessonSummary = {
  id?: string
  title?: string
  video?: string
  pdf?: string
  created_at?: string
}

export type UnitSummary = {
  id?: string
  title?: string
  description?: string
  created_at?: string
  lessons?: LessonSummary[]
}

export type CourseDetail = {
  id?: string
  name?: string
  description?: string
  author_username?: string
  units?: UnitSummary[]
}

export const countLessons = (units?: UnitSummary[]) =>
  units?.reduce((total, unit) => total + (unit.lessons?.length ?? 0), 0) ?? 0
