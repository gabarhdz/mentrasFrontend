import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CircleCheckBig,
  FileText,
  FolderTree,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

type UploadAuthResponse = {
  token: string
  expire: number
  signature: string
  publicKey: string
  urlEndpoint?: string
}

type CourseFormState = {
  name: string
  description: string
}

type UnitFormState = {
  title: string
  description: string
}

type LessonFormState = {
  title: string
  content: string
}

type UserProfile = {
  id?: string
  username?: string
  is_mentor?: boolean
}

type LessonSummary = {
  id?: string
  title?: string
  video?: string
  pdf?: string
}

type UnitSummary = {
  id?: string
  title?: string
  description?: string
  lessons?: LessonSummary[]
}

type CourseSummary = {
  id?: string
  name?: string
  description?: string
  author?: string
  author_username?: string
  units?: UnitSummary[]
}

type LessonDetail = {
  id?: string
  title?: string
  video?: string
  pdf?: string
  content?: string
}

type StepState = {
  uploadAuth: boolean
  videoUpload: boolean
  pdfUpload: boolean
  lessonCreate: boolean
}

type StatusTone = 'success' | 'pending'

const createInitialSteps = (): StepState => ({
  uploadAuth: false,
  videoUpload: false,
  pdfUpload: false,
  lessonCreate: false,
})

const COURSES_PER_PAGE = 6

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toCourseArray = (value: unknown): CourseSummary[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord) as CourseSummary[]
}

const normalizeCoursesResponse = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return toCourseArray(payload)
  }

  if (!isRecord(payload)) {
    return []
  }

  const possibleLists = [payload.results, payload.data, payload.items, payload.courses]

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) {
      return toCourseArray(candidate)
    }
  }

  return []
}

const getResponseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json()

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (typeof data.message === 'string') {
      return data.message
    }

    if (typeof data.error === 'string') {
      return data.error
    }

    if (data && typeof data === 'object') {
      const firstEntry = Object.entries(data)[0]

      if (firstEntry) {
        const [, value] = firstEntry

        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0]
        }

        if (typeof value === 'string') {
          return value
        }
      }
    }

    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const redirectToAuth = () => {
  clearAuthTokens()
  window.location.href = '/auth'
}

const ensureSuccessfulResponse = async (response: Response, fallbackMessage: string) => {
  if (response.status === 401) {
    redirectToAuth()
    throw new Error('Tu sesion vencio. Inicia sesion otra vez.')
  }

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, fallbackMessage))
  }

  return response
}

const fetchUserProfile = async (userId: string) => {
  const response = await authFetch(buildBackendUrl(`/api/user/${userId}/`))
  await ensureSuccessfulResponse(response, 'No se pudo cargar tu perfil.')
  return (await response.json()) as UserProfile
}

const fetchCourses = async () => {
  const response = await authFetch(buildBackendUrl('/api/learning/courses/'))
  await ensureSuccessfulResponse(response, 'No se pudieron cargar los cursos disponibles.')
  const data = await response.json()
  return normalizeCoursesResponse(data)
}

const createCourseRequest = async (payload: CourseFormState) => {
  const response = await authFetch(buildBackendUrl('/api/learning/courses/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureSuccessfulResponse(response, 'No se pudo crear el curso.')
  return (await response.json()) as CourseSummary
}

const createUnitRequest = async (courseId: string, payload: UnitFormState) => {
  const response = await authFetch(buildBackendUrl(`/api/learning/courses/${courseId}/units/`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureSuccessfulResponse(response, 'No se pudo crear la unidad.')
  return (await response.json()) as UnitSummary
}

const deleteResourceRequest = async (paths: string[], fallbackMessage: string) => {
  for (const path of paths) {
    const response = await authFetch(buildBackendUrl(path), {
      method: 'DELETE',
    })

    if (response.status === 401) {
      redirectToAuth()
      throw new Error('Tu sesion vencio. Inicia sesion otra vez.')
    }

    if (response.status === 404 || response.status === 405) {
      continue
    }

    if (!response.ok) {
      throw new Error(await getResponseErrorMessage(response, fallbackMessage))
    }

    return
  }

  throw new Error('No encontramos una ruta valida para quitar este contenido.')
}

const deleteUnitRequest = async (courseId: string, unitId: string) => {
  await deleteResourceRequest(
    [
      `/api/learning/courses/${courseId}/units/${unitId}/`,
      `/api/learning/units/${unitId}/`,
    ],
    'No se pudo quitar la unidad.',
  )
}

const deleteLessonRequest = async (unitId: string, lessonId: string) => {
  await deleteResourceRequest(
    [
      `/api/learning/units/${unitId}/lessons/${lessonId}/`,
      `/api/learning/lessons/${lessonId}/`,
    ],
    'No se pudo quitar la leccion.',
  )
}

const resolveUploadUrl = (data: Record<string, unknown>) => {
  const nestedResponse = data.response

  if (typeof data.url === 'string') {
    return data.url
  }

  if (typeof data.secure_url === 'string') {
    return data.secure_url
  }

  if (nestedResponse && typeof nestedResponse === 'object') {
    const responseRecord = nestedResponse as Record<string, unknown>

    if (typeof responseRecord.url === 'string') {
      return responseRecord.url
    }

    if (typeof responseRecord.secure_url === 'string') {
      return responseRecord.secure_url
    }
  }

  return null
}

const uploadFileToImageKit = async (
  file: File,
  auth: UploadAuthResponse,
  folder: string,
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', file.name)
  formData.append('publicKey', auth.publicKey)
  formData.append('token', auth.token)
  formData.append('signature', auth.signature)
  formData.append('expire', String(auth.expire))
  formData.append('folder', folder)
  formData.append('useUniqueFileName', 'true')

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'No se pudo cargar el archivo.'))
  }

  const data = (await response.json()) as Record<string, unknown>
  const url = resolveUploadUrl(data)

  if (!url) {
    throw new Error('No pudimos terminar de preparar el archivo. Intentalo otra vez.')
  }

  return url
}

const countLessons = (units?: UnitSummary[]) =>
  units?.reduce((total, unit) => total + (unit.lessons?.length ?? 0), 0) ?? 0

export default function Aprendizaje() {
  const userId = getStoredUserId()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [currentCatalogPage, setCurrentCatalogPage] = useState(1)
  const [courseForm, setCourseForm] = useState<CourseFormState>({
    name: '',
    description: '',
  })
  const [unitForm, setUnitForm] = useState<UnitFormState>({
    title: '',
    description: '',
  })
  const [lessonForm, setLessonForm] = useState<LessonFormState>({
    title: '',
    content: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [isCreatingUnit, setIsCreatingUnit] = useState(false)
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [courseFeedback, setCourseFeedback] = useState<FeedbackState | null>(null)
  const [unitFeedback, setUnitFeedback] = useState<FeedbackState | null>(null)
  const [lessonFeedback, setLessonFeedback] = useState<FeedbackState | null>(null)
  const [structureFeedback, setStructureFeedback] = useState<FeedbackState | null>(null)
  const [lessonStatusMessage, setLessonStatusMessage] = useState(
    'Sigue el orden: primero el curso, despues la unidad y al final la leccion.',
  )
  const [steps, setSteps] = useState<StepState>(createInitialSteps())
  const [createdLesson, setCreatedLesson] = useState<LessonDetail | null>(null)
  const [isDeletingUnitId, setIsDeletingUnitId] = useState('')
  const [isDeletingLessonId, setIsDeletingLessonId] = useState('')

  const ownedCourses = courses.filter((course) => course.author && user?.id && course.author === user.id)
  const selectedCourse =
    ownedCourses.find((course) => course.id === selectedCourseId) ?? null
  const selectedUnits = selectedCourse?.units ?? []
  const selectedUnit =
    selectedUnits.find((unit) => unit.id === selectedUnitId) ?? null
  const ownTotalUnits = ownedCourses.reduce((total, course) => total + (course.units?.length ?? 0), 0)
  const ownTotalLessons = ownedCourses.reduce((total, course) => total + countLessons(course.units), 0)
  const totalCatalogPages = Math.max(1, Math.ceil(courses.length / COURSES_PER_PAGE))
  const paginatedCourses = courses.slice(
    (currentCatalogPage - 1) * COURSES_PER_PAGE,
    currentCatalogPage * COURSES_PER_PAGE,
  )
  const hasLessonAttachments = Boolean(videoFile || pdfFile)

  const completedSteps = [
    {
      label: 'Preparamos la subida',
      done: !hasLessonAttachments || steps.uploadAuth,
      description: hasLessonAttachments
        ? 'Preparamos todo para cargar tus archivos de forma segura.'
        : 'Este paso se omite si decides crear la leccion sin archivos.',
    },
    {
      label: 'Subimos el video',
      done: !videoFile || steps.videoUpload,
      description: videoFile
        ? 'Tu video se esta cargando.'
        : 'Este paso se omite si no agregas video.',
    },
    {
      label: 'Adjuntamos el PDF',
      done: !pdfFile || steps.pdfUpload,
      description: pdfFile ? 'Sumamos el material complementario.' : 'Este paso se omite si no agregas PDF.',
    },
    {
      label: 'Creamos la leccion',
      done: steps.lessonCreate,
      description: 'Guardamos el contenido en tu espacio de aprendizaje.',
    },
  ]

  const completedCount = completedSteps.filter((step) => step.done).length
  const progressLabel = `${completedCount}/${completedSteps.length} pasos listos`
  const workflowChips = ['Course', 'Unit', 'Lesson']
  const ownCourseCount = ownedCourses.length

  const syncCourseTree = (
    nextCourses: CourseSummary[],
    options?: { preferredCourseId?: string; preferredUnitId?: string },
  ) => {
    const preferredCourseId = options?.preferredCourseId
    const preferredUnitId = options?.preferredUnitId
    const nextOwnedCourses = nextCourses.filter((course) => course.author && user?.id && course.author === user.id)
    const matchingCourse =
      nextOwnedCourses.find((course) => course.id === preferredCourseId) ??
      nextOwnedCourses.find((course) => course.id === selectedCourseId) ??
      nextOwnedCourses[0] ??
      null
    const nextCourseId = matchingCourse?.id ?? ''
    const nextUnits = matchingCourse?.units ?? []
    const matchingUnit =
      nextUnits.find((unit) => unit.id === preferredUnitId) ??
      nextUnits.find((unit) => unit.id === selectedUnitId) ??
      nextUnits[0] ??
      null

    setCourses(nextCourses)
    setSelectedCourseId(nextCourseId)
    setSelectedUnitId(matchingUnit?.id ?? '')
    setCurrentCatalogPage(1)
    setCoursesError(null)
  }

  const loadCourses = async (options?: { preferredCourseId?: string; preferredUnitId?: string }) => {
    try {
      setIsLoadingCourses(true)
      const nextCourses = await fetchCourses()
      syncCourseTree(nextCourses, options)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar los cursos disponibles.'

      if (message !== 'Tu sesion vencio. Inicia sesion otra vez.') {
        setCourses([])
        setSelectedCourseId('')
        setSelectedUnitId('')
        setCurrentCatalogPage(1)
        setCoursesError(message)
      }
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const handleCourseSelection = (courseId: string) => {
    const nextCourse = ownedCourses.find((course) => course.id === courseId) ?? null
    setSelectedCourseId(courseId)
    setSelectedUnitId(nextCourse?.units?.[0]?.id ?? '')
    setUnitFeedback(null)
    setLessonFeedback(null)
    setStructureFeedback(null)
  }

  const handleUnitSelection = (unitId: string) => {
    setSelectedUnitId(unitId)
    setLessonFeedback(null)
    setStructureFeedback(null)
  }

  const handleCourseFormChange = (field: keyof CourseFormState, value: string) => {
    setCourseForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleUnitFormChange = (field: keyof UnitFormState, value: string) => {
    setUnitForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleLessonFormChange = (field: keyof LessonFormState, value: string) => {
    setLessonForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setVideoFile(nextFile)
    setLessonFeedback(null)
  }

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setPdfFile(nextFile)
    setLessonFeedback(null)
  }

  useEffect(() => {
    if (!hasStoredSession()) {
      redirectToAuth()
      return
    }

    if (!userId) {
      setIsLoadingUser(false)
      setPageError('No pudimos identificar tu cuenta para cargar esta seccion.')
      return
    }

    const loadUser = async () => {
      try {
        setIsLoadingUser(true)
        setPageError(null)
        const profile = await fetchUserProfile(userId)
        setUser(profile)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo cargar tu perfil en este momento.'
        setPageError(message)
      } finally {
        setIsLoadingUser(false)
      }
    }

    void loadUser()
  }, [userId])

  useEffect(() => {
    if (!user) {
      setIsLoadingCourses(false)
      return
    }

    void loadCourses()
  }, [user])

  useEffect(() => {
    setCurrentCatalogPage((currentPage) => Math.min(currentPage, totalCatalogPages))
  }, [totalCatalogPages])

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!courseForm.name.trim() || !courseForm.description.trim()) {
      setCourseFeedback({
        type: 'error',
        message: 'Completa el nombre y la descripcion del curso antes de guardarlo.',
      })
      return
    }

    setIsCreatingCourse(true)
    setCourseFeedback(null)

    try {
      const course = await createCourseRequest({
        name: courseForm.name.trim(),
        description: courseForm.description.trim(),
      })

      await loadCourses({ preferredCourseId: course.id })
      setCourseForm({
        name: '',
        description: '',
      })
      setCourseFeedback({
        type: 'success',
        message: 'Curso creado. Ahora puedes agregarle unidades.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el curso.'
      setCourseFeedback({
        type: 'error',
        message,
      })
    } finally {
      setIsCreatingCourse(false)
    }
  }

  const handleCreateUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedCourseId) {
      setUnitFeedback({
        type: 'error',
        message: 'Selecciona un curso antes de crear una unidad.',
      })
      return
    }

    if (!unitForm.title.trim()) {
      setUnitFeedback({
        type: 'error',
        message: 'La unidad necesita al menos un titulo para guardarse.',
      })
      return
    }

    setIsCreatingUnit(true)
    setUnitFeedback(null)

    try {
      const unit = await createUnitRequest(selectedCourseId, {
        title: unitForm.title.trim(),
        description: unitForm.description.trim(),
      })

      await loadCourses({
        preferredCourseId: selectedCourseId,
        preferredUnitId: unit.id,
      })
      setUnitForm({
        title: '',
        description: '',
      })
      setUnitFeedback({
        type: 'success',
        message: 'Unidad creada. Ya puedes agregar lecciones dentro de ella.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la unidad.'
      setUnitFeedback({
        type: 'error',
        message,
      })
    } finally {
      setIsCreatingUnit(false)
    }
  }

  const handleCreateLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user?.is_mentor) {
      setLessonFeedback({
        type: 'error',
        message: 'Solo las cuentas con permiso de creador pueden usar esta seccion.',
      })
      return
    }

    if (!selectedCourseId) {
      setLessonFeedback({
        type: 'error',
        message: 'Selecciona un curso antes de crear la leccion.',
      })
      return
    }

    if (!selectedUnitId) {
      setLessonFeedback({
        type: 'error',
        message: 'Selecciona una unidad antes de crear la leccion.',
      })
      return
    }

    if (!lessonForm.title.trim()) {
      setLessonFeedback({
        type: 'error',
        message: 'Agrega un titulo para la leccion.',
      })
      return
    }

    setIsSubmittingLesson(true)
    setLessonFeedback(null)
    setCreatedLesson(null)
    setSteps(createInitialSteps())

    try {
      let uploadAuth: UploadAuthResponse | null = null
      let videoUrl: string | null = null
      let pdfUrl: string | null = null

      if (hasLessonAttachments) {
        setLessonStatusMessage('Preparando tus materiales...')
        const authResponse = await authFetch(buildBackendUrl('/api/learning/uploads/auth/'))
        await ensureSuccessfulResponse(authResponse, 'No se pudo preparar la carga de archivos.')

        uploadAuth = (await authResponse.json()) as UploadAuthResponse
        setSteps((currentSteps) => ({ ...currentSteps, uploadAuth: true }))
      }

      if (videoFile && uploadAuth) {
        setLessonStatusMessage('Subiendo el video principal...')
        videoUrl = await uploadFileToImageKit(
          videoFile,
          uploadAuth,
          '/learning/lessons/videos',
        )
        setSteps((currentSteps) => ({ ...currentSteps, videoUpload: true }))
      }

      if (pdfFile && uploadAuth) {
        setLessonStatusMessage('Subiendo el material complementario...')
        pdfUrl = await uploadFileToImageKit(
          pdfFile,
          uploadAuth,
          '/learning/lessons/pdfs',
        )
        setSteps((currentSteps) => ({ ...currentSteps, pdfUpload: true }))
      }

      setLessonStatusMessage('Guardando la leccion...')
      const lessonResponse = await authFetch(
        buildBackendUrl(`/api/learning/units/${selectedUnitId}/lessons/`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: lessonForm.title.trim(),
            content: lessonForm.content.trim(),
            ...(videoUrl ? { video_url: videoUrl } : {}),
            ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
          }),
        },
      )

      await ensureSuccessfulResponse(lessonResponse, 'No se pudo guardar la leccion.')

      const lesson = (await lessonResponse.json()) as LessonDetail
      setSteps((currentSteps) => ({ ...currentSteps, lessonCreate: true }))
      setCreatedLesson(lesson)
      setLessonFeedback({
        type: 'success',
        message: 'Leccion creada correctamente.',
      })
      setLessonStatusMessage(
        hasLessonAttachments
          ? 'Todo quedo listo. Tu leccion y sus materiales ya aparecen dentro del contenido.'
          : 'Todo quedo listo. Tu leccion ya aparece dentro del contenido.',
      )
      setLessonForm({
        title: '',
        content: '',
      })
      setVideoFile(null)
      setPdfFile(null)
      await loadCourses({
        preferredCourseId: selectedCourseId,
        preferredUnitId: selectedUnitId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrio un error inesperado.'
      setLessonFeedback({
        type: 'error',
        message,
      })
      setLessonStatusMessage('El proceso se detuvo antes de completar la leccion.')
    } finally {
      setIsSubmittingLesson(false)
    }
  }

  const handleRemoveUnit = async (unitId: string) => {
    if (!selectedCourseId) {
      setStructureFeedback({
        type: 'error',
        message: 'Selecciona un curso antes de quitar una unidad.',
      })
      return
    }

    setIsDeletingUnitId(unitId)
    setStructureFeedback(null)

    try {
      await deleteUnitRequest(selectedCourseId, unitId)
      await loadCourses({ preferredCourseId: selectedCourseId })
      setStructureFeedback({
        type: 'success',
        message: 'Unidad eliminada. La estructura del curso ya quedo actualizada.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo quitar la unidad.'
      setStructureFeedback({
        type: 'error',
        message,
      })
    } finally {
      setIsDeletingUnitId('')
    }
  }

  const handleRemoveLesson = async (unitId: string, lessonId: string) => {
    setIsDeletingLessonId(lessonId)
    setStructureFeedback(null)

    try {
      await deleteLessonRequest(unitId, lessonId)
      await loadCourses({
        preferredCourseId: selectedCourseId,
        preferredUnitId: unitId,
      })
      setStructureFeedback({
        type: 'success',
        message: 'Leccion eliminada. Ya no aparece dentro de la unidad.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo quitar la leccion.'
      setStructureFeedback({
        type: 'error',
        message,
      })
    } finally {
      setIsDeletingLessonId('')
    }
  }

  const getFileState = (file: File | null, optional = false): { label: string; tone: StatusTone } => {
    if (file) {
      return {
        label: 'Archivo listo',
        tone: 'success',
      }
    }

    return {
      label: optional ? 'Opcional' : 'Pendiente',
      tone: 'pending',
    }
  }

  const videoState = getFileState(videoFile)
  const pdfState = getFileState(pdfFile, true)

  const renderCatalogPagination = () => {
    if (totalCatalogPages <= 1) {
      return null
    }

    return (
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pagina {currentCatalogPage} de {totalCatalogPages}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentCatalogPage === 1}
            type="button"
            onClick={() => setCurrentCatalogPage((page) => Math.max(1, page - 1))}
          >
            Anterior
          </button>
          <button
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentCatalogPage === totalCatalogPages}
            type="button"
            onClick={() => setCurrentCatalogPage((page) => Math.min(totalCatalogPages, page + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    )
  }

  const renderCourseCatalog = (title: string, description: string) => (
    <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
            Catalogo
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        {isLoadingCourses ? <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

      {coursesError ? (
        <div className="mt-4 rounded-[1.5rem] border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
          {coursesError}
        </div>
      ) : null}

      {!courses.length && !isLoadingCourses ? (
        <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
          Todavia no hay cursos disponibles para mostrar.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {paginatedCourses.map((course) => (
              <Link
                key={course.id ?? course.name}
                className="block rounded-[1.5rem] border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/30 hover:bg-primary/6"
                to={`/aprendizaje/cursos/${course.id}`}
              >
                <p className="text-sm font-semibold text-foreground">
                  {course.name || 'Curso sin nombre'}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {course.description?.trim() || 'Este curso aun no tiene descripcion.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {course.units?.length ?? 0} unidades
                  </span>
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {countLessons(course.units)} lecciones
                  </span>
                  {course.author_username ? (
                    <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Por {course.author_username}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
          {renderCatalogPagination()}
        </>
      )}
    </div>
  )

  if (isLoadingUser) {
    return (
      <main className="relative min-h-screen overflow-hidden text-foreground">
        <Header />
        <section className="px-6 py-14 md:px-12 lg:px-24 xl:px-40">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Cargando tu espacio de aprendizaje...
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (pageError) {
    return (
      <main className="relative min-h-screen overflow-hidden text-foreground">
        <Header />
        <section className="px-6 py-14 md:px-12 lg:px-24 xl:px-40">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-accent/25 bg-card/90 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">No pudimos abrir Aprendizaje</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{pageError}</p>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!user?.is_mentor) {
    return (
      <main className="relative min-h-screen overflow-hidden text-foreground">
        <Header />
        <section className="relative px-6 py-14 md:px-12 lg:px-24 xl:px-40">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-primary/8 via-secondary/6 to-transparent" />
          <div className="mx-auto max-w-6xl space-y-6">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/85 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
              to="/aprendizaje"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Aprendizaje
            </Link>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-sm backdrop-blur">
              <div className="border-b border-border/70 bg-linear-to-br from-secondary/10 via-primary/8 to-transparent px-7 py-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  <BookOpen className="h-3.5 w-3.5" />
                  Aprendizaje
                </div>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                  Esta cuenta no puede crear contenido desde aqui
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Esta seccion de creacion solo esta disponible para ciertas cuentas, asi que te
                  mostramos una vista simple y sin opciones que no puedas usar.
                </p>
              </div>

              <div className="space-y-4 px-7 py-7">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-sm font-semibold text-foreground">Modo lectura</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Desde esta cuenta puedes navegar el espacio de aprendizaje, pero no crear nuevo contenido.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-sm font-semibold text-foreground">Como funciona</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Si en algun momento tu cuenta recibe permisos de creador, aqui mismo podras armar cursos,
                    unidades y lecciones paso a paso.
                  </p>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 backdrop-blur">
                <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Jerarquia
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Como funciona el flujo</h2>
                <div className="mt-4 space-y-3">
                  {workflowChips.map((step, index) => (
                    <div key={step} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paso {index + 1}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {step === 'Course' ? 'Curso' : step === 'Unit' ? 'Unidad' : 'Leccion'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {renderCourseCatalog(
                'Cursos disponibles',
                'Explora el catalogo completo. Al abrir un curso podras ver su contenido en una pagina individual.',
              )}
            </aside>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <Header />

      <section className="relative px-6 py-14 md:px-12 lg:px-24 xl:px-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-primary/8 via-secondary/6 to-transparent" />
        <div className="pointer-events-none absolute left-0 top-24 -z-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/85 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
            to="/aprendizaje"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Aprendizaje
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_28px_80px_-46px_rgba(0,137,123,0.45)] backdrop-blur">
              <div className="border-b border-border/70 bg-linear-to-br from-primary/12 via-secondary/10 to-accent/12 px-7 py-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.24em] text-primary uppercase">
                  <BookOpen className="h-3.5 w-3.5" />
                  Menu creador
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                  Crea un curso nuevo o gestiona el contenido que ya existe
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  Aqui tienes dos caminos claros: empezar un curso desde cero o entrar a un curso
                  existente para sumarle mas unidades, mas lecciones o quitar contenido.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {workflowChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {chip === 'Course' ? 'Curso' : chip === 'Unit' ? 'Unidad' : 'Leccion'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 px-7 py-7 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paso 1</p>
                  <p className="mt-2 text-base font-semibold text-foreground">Curso</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Define el contenedor principal del contenido.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paso 2</p>
                  <p className="mt-2 text-base font-semibold text-foreground">Unidad</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Organiza el curso en bloques claros y manejables.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paso 3</p>
                  <p className="mt-2 text-base font-semibold text-foreground">Leccion</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Publica la clase final con video, texto y PDF opcional.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                className="rounded-[1.75rem] border border-primary/20 bg-primary/8 p-5 transition hover:border-primary/35 hover:bg-primary/10"
                href="#crear-curso"
              >
                <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                  Crear nuevo
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">Empieza un curso desde cero</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Define el curso base y luego continua con su estructura.
                </p>
              </a>

              <a
                className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 transition hover:border-primary/30 hover:bg-primary/6"
                href="#gestionar-contenido"
              >
                <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Gestionar existente
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Agrega o quita contenido en cursos existentes
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Selecciona uno de tus cursos y trabaja sus unidades y lecciones aparte.
                </p>
              </a>
            </div>

            <div
              id="crear-curso"
              className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                    Crear nuevo
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Crea un curso nuevo</h2>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Base de toda la estructura
                </span>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleCreateCourse}>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Nombre del curso</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Ej. Ventas para pymes"
                    value={courseForm.name}
                    onChange={(event) => handleCourseFormChange('name', event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Descripcion del curso</span>
                  <textarea
                    className="min-h-32 w-full rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Cuenta brevemente que va a aprender la persona en este curso"
                    value={courseForm.description}
                    onChange={(event) => handleCourseFormChange('description', event.target.value)}
                  />
                </label>

                {courseFeedback ? (
                  <div
                    className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
                      courseFeedback.type === 'success'
                        ? 'border-primary/25 bg-primary/8 text-foreground'
                        : 'border-accent/30 bg-accent/10 text-foreground'
                    }`}
                  >
                    {courseFeedback.message}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:translate-y-[-1px] hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isCreatingCourse}
                    type="submit"
                  >
                    {isCreatingCourse ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheckBig className="h-4 w-4" />}
                    {isCreatingCourse ? 'Guardando...' : 'Crear curso'}
                  </button>
                </div>
              </form>
            </div>

            <div
              id="gestionar-contenido"
              className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    <FolderTree className="h-3.5 w-3.5" />
                    Gestionar existente
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    Agrega mas contenido o quita lo que ya no va
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Esta parte funciona aparte del curso nuevo. Primero eliges uno de tus cursos y
                    despues decides si vas a sumarle unidades, agregar lecciones o limpiar contenido.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  {selectedCourse ? `Curso activo: ${selectedCourse.name || 'Sin nombre'}` : 'Selecciona un curso propio'}
                </div>
              </div>

              {!ownedCourses.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Cuando crees tu primer curso, aqui podras volver para seguirlo armando y tambien
                  para quitar unidades o lecciones existentes.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Curso que vas a gestionar</span>
                      <select
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={selectedCourseId}
                        onChange={(event) => handleCourseSelection(event.target.value)}
                      >
                        {ownedCourses.map((course) => (
                          <option key={course.id ?? course.name} value={course.id ?? ''}>
                            {course.name || 'Curso sin nombre'}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-[1.5rem] border border-primary/20 bg-primary/8 p-4 text-sm leading-6 text-muted-foreground">
                      <p className="font-semibold text-foreground">Que puedes hacer aqui</p>
                      <p className="mt-2">
                        Usa los formularios de abajo para agregar mas contenido o el panel final para
                        quitar unidades y lecciones del curso seleccionado.
                      </p>
                    </div>
                  </div>

                  {structureFeedback ? (
                    <div
                      className={`mt-5 rounded-[1.5rem] border px-4 py-3 text-sm ${
                        structureFeedback.type === 'success'
                          ? 'border-primary/25 bg-primary/8 text-foreground'
                          : 'border-accent/30 bg-accent/10 text-foreground'
                      }`}
                    >
                      {structureFeedback.message}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    Gestionar existente
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Agrega una unidad</h2>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {selectedCourse ? `Curso activo: ${selectedCourse.name || 'Sin nombre'}` : 'Primero crea un curso'}
                </span>
              </div>

              {!ownedCourses.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Cuando tengas al menos un curso creado, aqui podras sumar las unidades.
                </div>
              ) : (
                <form className="mt-6 space-y-5" onSubmit={handleCreateUnit}>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Curso donde ira esta unidad</span>
                    <select
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={selectedCourseId}
                      onChange={(event) => handleCourseSelection(event.target.value)}
                    >
                      {ownedCourses.map((course) => (
                        <option key={course.id ?? course.name} value={course.id ?? ''}>
                          {course.name || 'Curso sin nombre'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Titulo de la unidad</span>
                    <input
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Ej. Fundamentos del tema"
                      value={unitForm.title}
                      onChange={(event) => handleUnitFormChange('title', event.target.value)}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Descripcion de la unidad</span>
                    <textarea
                      className="min-h-28 w-full rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Resume que se cubre dentro de esta unidad"
                      value={unitForm.description}
                      onChange={(event) => handleUnitFormChange('description', event.target.value)}
                    />
                  </label>

                  {unitFeedback ? (
                    <div
                      className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
                        unitFeedback.type === 'success'
                          ? 'border-primary/25 bg-primary/8 text-foreground'
                          : 'border-accent/30 bg-accent/10 text-foreground'
                      }`}
                    >
                      {unitFeedback.message}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:translate-y-[-1px] hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isCreatingUnit}
                      type="submit"
                    >
                      {isCreatingUnit ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheckBig className="h-4 w-4" />}
                      {isCreatingUnit ? 'Guardando...' : 'Crear unidad'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    Gestionar existente
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Agrega una leccion</h2>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {selectedUnit ? `Unidad activa: ${selectedUnit.title || 'Sin titulo'}` : 'Selecciona una unidad'}
                </span>
              </div>

              {!ownedCourses.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Crea primero un curso para habilitar la configuracion de la leccion.
                </div>
              ) : !selectedUnits.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Este curso aun no tiene unidades. Crea una unidad y luego vuelve a este paso.
                </div>
              ) : (
                <form className="mt-6 space-y-6" onSubmit={handleCreateLesson}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Curso de la leccion</span>
                      <select
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={selectedCourseId}
                        onChange={(event) => handleCourseSelection(event.target.value)}
                      >
                        {ownedCourses.map((course) => (
                          <option key={course.id ?? course.name} value={course.id ?? ''}>
                            {course.name || 'Curso sin nombre'}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Unidad donde ira la leccion</span>
                      <select
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={selectedUnitId}
                        onChange={(event) => handleUnitSelection(event.target.value)}
                      >
                        {selectedUnits.map((unit) => (
                          <option key={unit.id ?? unit.title} value={unit.id ?? ''}>
                            {unit.title || 'Unidad sin titulo'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                    La leccion se va a crear dentro de{' '}
                    <span className="font-semibold text-foreground">
                      {selectedCourse?.name || 'Sin curso'}
                    </span>{' '}
                    /{' '}
                    <span className="font-semibold text-foreground">
                      {selectedUnit?.title || 'Sin unidad'}
                    </span>
                    .
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Titulo de la leccion</span>
                      <input
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Ej. Introduccion al modulo"
                        value={lessonForm.title}
                        onChange={(event) => handleLessonFormChange('title', event.target.value)}
                      />
                    </label>

                    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                      <p className="text-sm font-medium text-foreground">Estado de la seleccion</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {selectedUnit?.lessons?.length
                          ? `Esta unidad ya tiene ${selectedUnit.lessons.length} leccion(es).`
                          : 'Esta unidad todavia no tiene lecciones.'}
                      </p>
                    </div>
                  </div>

                  <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Descripcion o contenido</span>
                    <textarea
                      className="min-h-36 w-full rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Agrega un resumen, guia o notas para esta leccion"
                      value={lessonForm.content}
                      onChange={(event) => handleLessonFormChange('content', event.target.value)}
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="group flex min-h-44 cursor-pointer flex-col justify-between rounded-[1.75rem] border border-dashed border-primary/35 bg-primary/6 p-5 transition hover:border-primary/60 hover:bg-primary/10">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              videoState.tone === 'success'
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-primary/20 bg-background/85 text-primary'
                            }`}
                          >
                            {videoState.label}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Video principal</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Puedes subirlo si esta leccion necesita video, pero no es obligatorio.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input
                          accept=".mp4,.mov,.avi,.mkv,.webm,.m4v"
                          className="hidden"
                          type="file"
                          onChange={handleVideoChange}
                        />
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/85 px-3 py-1.5 text-xs font-medium text-primary">
                          <Upload className="h-3.5 w-3.5" />
                          Seleccionar video
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {videoFile
                            ? `${videoFile.name} • ${formatFileSize(videoFile.size)}`
                            : 'Aun no elegiste un video.'}
                        </p>
                      </div>
                    </label>

                    <label className="group flex min-h-44 cursor-pointer flex-col justify-between rounded-[1.75rem] border border-dashed border-secondary/35 bg-secondary/8 p-5 transition hover:border-secondary/60 hover:bg-secondary/12">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              pdfState.tone === 'success'
                                ? 'bg-secondary text-secondary-foreground'
                                : 'border border-secondary/25 bg-background/85 text-secondary-foreground'
                            }`}
                          >
                            {pdfState.label}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">PDF opcional</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Puedes sumar una guia, plantilla o material de apoyo.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input accept=".pdf" className="hidden" type="file" onChange={handlePdfChange} />
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/25 bg-background/85 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                          <Upload className="h-3.5 w-3.5" />
                          Seleccionar PDF
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {pdfFile
                            ? `${pdfFile.name} • ${formatFileSize(pdfFile.size)}`
                            : 'Puedes dejarlo vacio si no necesitas adjuntar nada mas.'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {lessonFeedback ? (
                    <div
                      className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
                        lessonFeedback.type === 'success'
                          ? 'border-primary/25 bg-primary/8 text-foreground'
                          : 'border-accent/30 bg-accent/10 text-foreground'
                      }`}
                    >
                      {lessonFeedback.message}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{lessonStatusMessage}</div>
                      <div className="text-xs font-medium text-primary">{progressLabel}</div>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:translate-y-[-1px] hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSubmittingLesson}
                      type="submit"
                    >
                      {isSubmittingLesson ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheckBig className="h-4 w-4" />}
                      {isSubmittingLesson ? 'Procesando...' : 'Crear leccion'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    Gestionar existente
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Quita unidades o lecciones del curso actual
                  </h2>
                </div>
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {selectedCourse ? `Editando ${selectedCourse.name || 'curso sin nombre'}` : 'Sin curso seleccionado'}
                </span>
              </div>

              {!ownedCourses.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Esta seccion se habilita cuando ya tengas cursos propios.
                </div>
              ) : !selectedCourse ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Selecciona un curso para revisar su estructura actual.
                </div>
              ) : !selectedUnits.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                  Este curso aun no tiene unidades para quitar.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {selectedUnits.map((unit, unitIndex) => (
                    <article
                      key={unit.id ?? `${unit.title}-${unitIndex}`}
                      className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {unit.title || `Unidad ${unitIndex + 1}`}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {unit.description?.trim() || 'Esta unidad aun no tiene descripcion.'}
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!unit.id || isDeletingUnitId === unit.id || isDeletingLessonId !== ''}
                          type="button"
                          onClick={() => unit.id && handleRemoveUnit(unit.id)}
                        >
                          {isDeletingUnitId === unit.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          {isDeletingUnitId === unit.id ? 'Quitando...' : 'Quitar unidad'}
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {unit.lessons?.length ? (
                          unit.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id ?? `${unit.id}-${lessonIndex}`}
                              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {lesson.title || `Leccion ${lessonIndex + 1}`}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Esta leccion pertenece a la unidad {unit.title || `#${unitIndex + 1}`}.
                                </p>
                              </div>
                              <button
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!lesson.id || !unit.id || isDeletingLessonId === lesson.id || isDeletingUnitId !== ''}
                                type="button"
                                onClick={() => unit.id && lesson.id && handleRemoveLesson(unit.id, lesson.id)}
                              >
                                {isDeletingLessonId === lesson.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                {isDeletingLessonId === lesson.id ? 'Quitando...' : 'Quitar leccion'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                            Esta unidad no tiene lecciones. Puedes quitar la unidad completa si ya no la necesitas.
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[0_24px_60px_-50px_rgba(38,50,56,0.45)] backdrop-blur">
              <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                Resumen mentor
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Tu estructura actual</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cursos propios</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{ownCourseCount}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unidades propias</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{ownTotalUnits}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lecciones propias</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{ownTotalLessons}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Ruta seleccionada</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {selectedCourse?.name || 'Sin curso propio'}
                  </span>{' '}
                  /{' '}
                  <span className="font-medium text-foreground">
                    {selectedUnit?.title || 'Sin unidad propia'}
                  </span>
                </p>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-primary/20 bg-primary/8 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Dos formas de trabajar</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Arriba tienes una parte para crear cursos nuevos y otra, separada, para seguir
                      editando cursos que ya existen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {renderCourseCatalog(
              'Explora todos los cursos',
              'Puedes entrar a cualquier curso del catalogo para ver sus unidades y lecciones en una pagina dedicada.',
            )}

            <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 backdrop-blur">
              <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                Progreso de subida
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Estado de la leccion</h2>
              <div className="mt-5 space-y-3">
                {completedSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`rounded-2xl border px-4 py-4 text-sm ${
                      step.done
                        ? 'border-primary/20 bg-primary/8 text-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.done ? <CircleCheckBig className="h-4 w-4" /> : <span>{index + 1}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{step.label}</p>
                        <p className="mt-1 leading-5 text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {createdLesson ? (
              <div className="rounded-[2rem] border border-border/70 bg-linear-to-br from-background via-card to-primary/6 p-6 backdrop-blur">
                <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                  Resultado
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">La leccion ya quedo creada</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-foreground">Titulo:</span>{' '}
                    <span className="text-muted-foreground">{createdLesson.title || '-'}</span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">ID:</span>{' '}
                    <span className="break-all text-muted-foreground">{createdLesson.id || '-'}</span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Video URL:</span>{' '}
                    <span className="break-all text-muted-foreground">{createdLesson.video || '-'}</span>
                  </p>
                  {createdLesson.pdf ? (
                    <p>
                      <span className="font-medium text-foreground">PDF URL:</span>{' '}
                      <span className="break-all text-muted-foreground">{createdLesson.pdf}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
