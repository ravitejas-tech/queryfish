import { CodeBlock } from '../components/code-block'

const clientCode = `// src/client.ts
// A small fetch wrapper. QueryFish doesn't care which
// HTTP library you use, as long as the object has
// a request() method with this shape.

interface RequestConfig {
  method: string
  url: string
  params?: Record<string, unknown>
  headers?: Record<string, unknown>
  data?: unknown
}

export const client = {
  async request<T>(config: RequestConfig): Promise<T> {
    const url = new URL(config.url, 'https://petstore.example.com')

    for (const [key, value] of Object.entries(config.params ?? {})) {
      if (value != null) url.searchParams.set(key, String(value))
    }

    const response = await fetch(url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers as Record<string, string>),
      },
      body: config.data
        ? JSON.stringify(config.data)
        : undefined,
    })

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}\`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  },
}`

const configCode = `// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  client: './src/client.ts',
})`

const queriesUsageCode = `import { useListPets, useGetPet } from './api/queries'

function PetList() {
  const { data: pets, isPending } = useListPets({
    // status only accepts 'available' | 'pending' | 'sold'
    variables: { status: 'available' },
  })

  if (isPending) return <Loading />

  return (
    <ul>
      {pets.map((pet) => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  )
}

function PetDetail({ petId }: { petId: string }) {
  const { data: pet, isPending } = useGetPet({
    variables: { petId },
  })

  if (isPending) return <Loading />

  return (
    <div>
      <h2>{pet.name}</h2>
      <p>Tag: {pet.tag ?? 'none'}</p>
    </div>
  )
}`

const mutationsUsageCode = `import { useCreatePet } from './api/mutations'
import { useQueryClient } from '@tanstack/react-query'

function CreatePetForm() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useCreatePet({
    onSuccess: () => {
      // refetch everything under /pets
      queryClient.invalidateQueries({
        queryKey: ['pets'],
      })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutate({
      body: { name: 'Buddy', tag: 'dog' },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields... */}
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Create pet'}
      </button>
    </form>
  )
}`

const appSetupCode = `// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'

const queryClient = new QueryClient()

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}`

export function ExamplesPage() {
    return (
        <div className='min-h-screen pt-24 pb-16'>
            <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
                <div className='mb-16'>
                    <h1 className='mb-4 text-4xl font-extrabold text-text-primary'>Examples</h1>
                    <p className='max-w-2xl text-lg text-text-secondary'>
                        A walk through the{' '}
                        <a
                            href='https://github.com/ravitejas-tech/queryfish/tree/main/examples/petstore-react'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-accent-400 no-underline hover:underline'>
                            petstore-react
                        </a>{' '}
                        example, a small React app that uses hooks QueryFish generated from a Petstore spec.
                    </p>
                </div>

                {/* Steps */}
                <div className='space-y-16'>
                    {/* Step 1: App setup */}
                    <ExampleSection
                        step='01'
                        title='Set up React Query'
                        description='Wrap the app in a QueryClientProvider. This is the normal React Query setup, nothing specific to QueryFish.'>
                        <CodeBlock
                            code={appSetupCode}
                            title='src/main.tsx'
                        />
                    </ExampleSection>

                    <div className='section-divider' />

                    {/* Step 2: Client */}
                    <ExampleSection
                        step='02'
                        title='Write the HTTP client'
                        description="QueryFish doesn't include an HTTP client. You write a small one around fetch or axios, and that's where auth, interceptors and the base URL go.">
                        <CodeBlock
                            code={clientCode}
                            title='src/client.ts'
                        />
                    </ExampleSection>

                    <div className='section-divider' />

                    {/* Step 3: Config */}
                    <ExampleSection
                        step='03'
                        title='Configure QueryFish'
                        description="Point it at the spec and the client. That's all the config this example needs.">
                        <CodeBlock
                            code={configCode}
                            title='queryfish.config.ts'
                        />
                    </ExampleSection>

                    <div className='section-divider' />

                    {/* Step 4: Using queries */}
                    <ExampleSection
                        step='04'
                        title='Use the query hooks'
                        description="Import the hooks and pass variables. They're checked against the spec, so a wrong name or value won't compile.">
                        <CodeBlock
                            code={queriesUsageCode}
                            title='Queries'
                        />
                    </ExampleSection>

                    <div className='section-divider' />

                    {/* Step 5: Using mutations */}
                    <ExampleSection
                        step='05'
                        title='Use the mutation hooks'
                        description='Mutations work the same way. Because query keys follow the URL, one invalidateQueries call refreshes everything under /pets.'>
                        <CodeBlock
                            code={mutationsUsageCode}
                            title='Mutations'
                        />
                    </ExampleSection>
                </div>

                {/* Full example link */}
                <div className='mt-20 text-center'>
                    <div className='glass-card inline-block px-8 py-6'>
                        <p className='mb-4 text-text-secondary'>
                            The full app, including the generated files, is on GitHub.
                        </p>
                        <a
                            href='https://github.com/ravitejas-tech/queryfish/tree/main/examples/petstore-react'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-primary'>
                            View the source
                            <span>→</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ExampleSection({
    step,
    title,
    description,
    children,
}: {
    step: string
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <div className='grid gap-8 lg:grid-cols-[280px_1fr]'>
            <div>
                <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-accent-400/20 bg-accent-500/5 font-mono text-sm font-bold text-accent-400'>
                    {step}
                </div>
                <h2 className='mb-2 text-xl font-bold text-text-primary'>{title}</h2>
                <p className='text-sm leading-relaxed text-text-secondary'>{description}</p>
            </div>
            <div>{children}</div>
        </div>
    )
}
