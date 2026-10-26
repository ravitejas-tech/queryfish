import { Link } from 'react-router'
import { CodeBlock, InstallSnippet } from '../components/code-block'

const features = [
    {
        title: 'Query keys follow your URLs',
        description:
            "GET /pets/{petId} gets the key ['pets', '{petId}']. Invalidate ['pets'] after a mutation and every query under /pets refetches, so there's no list of hooks to keep up to date.",
    },
    {
        title: 'Pagination is opt-in',
        description:
            "OpenAPI doesn't say how an endpoint paginates, so QueryFish doesn't guess. You name the cursor param and the field with the next cursor, and it writes an infinite query for that endpoint.",
    },
    {
        title: 'Nothing added to your bundle',
        description:
            'QueryFish is a dev dependency. The generated code imports react-query-kit, TanStack Query and your own HTTP client, and nothing from QueryFish.',
    },
    {
        title: 'Output is type-checked',
        description:
            'The test suite runs tsc over the generated code against the real react-query-kit types, so a type error in the output fails our CI instead of your build.',
    },
    {
        title: 'Works with messy specs',
        description:
            'Recursive schemas, missing or duplicate operationIds, reserved words, allOf/oneOf and Swagger 2.0 are all handled, and each one has a test case.',
    },
    {
        title: 'Watch mode',
        description:
            'Run it with --watch and the hooks are regenerated whenever you save the spec or the config. Output goes through your Prettier config.',
    },
]

const beforeCode = `const { data } = useQuery({
  queryKey: ['pet', petId],
  queryFn: () =>
    fetch(\`/api/pets/\${petId}\`)
      .then(r => r.json()),
})
// data is any, and the key is
// whatever you typed`

const afterCode = `const { data } = useGetPet({
  variables: { petId },
})
// data is Pet, and leaving out
// petId is a type error`

const configCode = `// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  client: './src/api/client.ts',
})`

const generatedOutput = `src/api/
├── types.ts           # interfaces and types
├── requests.ts        # plain async functions
├── queries.ts         # createQuery hooks
├── mutations.ts       # createMutation hooks
├── infiniteQueries.ts # only if you opt in
└── index.ts           # re-exports`

export function Landing() {
    return (
        <div className='min-h-screen'>
            {/* ═══ Hero ═══ */}
            <section className='relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28'>
                <div className='hero-mesh' />
                <div className='relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8'>
                    <div className='animate-fade-in-up'>
                        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-sm text-brand-sky'>
                            <span className='inline-block h-2 w-2 animate-pulse rounded-full bg-brand-sky' />
                            v1.0.0
                        </div>
                    </div>

                    <h1 className='animate-fade-in-up-delay-1 mb-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl lg:text-7xl'>
                        <span className='text-text-primary'>React Query hooks,</span>
                        <br />
                        <span className='gradient-text'>generated from your spec.</span>
                    </h1>

                    <p className='animate-fade-in-up-delay-2 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl'>
                        QueryFish reads your OpenAPI or Swagger file and writes typed{' '}
                        <a
                            href='https://tanstack.com/query'
                            className='text-brand-sky no-underline hover:underline'>
                            React Query
                        </a>{' '}
                        hooks with{' '}
                        <a
                            href='https://github.com/HuolalaTech/react-query-kit'
                            className='text-brand-sky no-underline hover:underline'>
                            react-query-kit
                        </a>
                        , along with the request functions and types behind them. It runs at build time, so nothing
                        extra ships to your users.
                    </p>

                    <div className='animate-fade-in-up-delay-3 mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                        <Link
                            to='/docs'
                            className='btn-primary'>
                            Get started
                            <span>→</span>
                        </Link>
                        <a
                            href='https://github.com/ravitejas-tech/queryfish'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-secondary'>
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='currentColor'>
                                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                            </svg>
                            View on GitHub
                        </a>
                    </div>

                    <div className='animate-fade-in-up-delay-4'>
                        <InstallSnippet />
                    </div>
                </div>
            </section>

            {/* ═══ Before / after ═══ */}
            <section className='relative py-24'>
                <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>
                            Before and after
                        </p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            Less code to <span className='gradient-text'>keep in sync</span>
                        </h2>
                        <p className='mx-auto max-w-2xl text-text-secondary'>
                            Your OpenAPI spec already describes the API. Without a generator you describe it again in
                            fetch functions, again in types, and again in query hooks, then update all of them by hand
                            when the API changes. QueryFish writes those parts from the spec.
                        </p>
                    </div>

                    <div className='grid gap-6 md:grid-cols-2 items-stretch'>
                        {/* Before card */}
                        <div className='comparison-card h-full'>
                            <div className='flex h-full flex-col rounded-2xl bg-gradient-to-br from-red-500/5 to-transparent p-1'>
                                <div className='flex h-full flex-1 flex-col rounded-xl bg-ocean-900/80'>
                                    <div className='flex items-center gap-2 border-b border-white/5 px-5 py-3'>
                                        <span className='inline-block h-2.5 w-2.5 rounded-full bg-red-400/60' />
                                        <span className='text-sm font-medium text-red-400/80'>Before: by hand</span>
                                    </div>
                                    <div className='flex flex-1 flex-col justify-between p-5'>
                                        <pre className='overflow-x-auto font-mono text-sm leading-relaxed text-text-secondary'>
                                            <code>{beforeCode}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* After card */}
                        <div className='comparison-card h-full'>
                            <div className='flex h-full flex-col rounded-2xl bg-gradient-to-br from-emerald-500/5 to-brand-blue/5 p-1'>
                                <div className='flex h-full flex-1 flex-col rounded-xl bg-ocean-900/80'>
                                    <div className='flex items-center gap-2 border-b border-white/5 px-5 py-3'>
                                        <span className='inline-block h-2.5 w-2.5 rounded-full bg-emerald-400/60' />
                                        <span className='text-sm font-medium text-emerald-400/80'>
                                            After: generated
                                        </span>
                                    </div>
                                    <div className='flex flex-1 flex-col justify-between p-5'>
                                        <pre className='overflow-x-auto font-mono text-sm leading-relaxed text-text-secondary'>
                                            <code>{afterCode}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ Features ═══ */}
            <section className='py-20'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>Features</p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            What you <span className='gradient-text'>get</span>
                        </h2>
                        <p className='mx-auto max-w-xl text-text-secondary'>
                            A few choices that shape the generated code, and why they were made.
                        </p>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className='glass-card p-6'>
                                <h3 className='mb-2 text-lg font-semibold text-text-primary'>{feature.title}</h3>
                                <p className='text-sm leading-relaxed text-text-secondary'>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ How it works ═══ */}
            <section className='py-20'>
                <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
                    <div className='mb-14 text-center'>
                        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-brand-sky'>
                            How it works
                        </p>
                        <h2 className='mb-4 text-3xl font-bold text-text-primary sm:text-4xl'>
                            Set it up <span className='gradient-text'>once</span>
                        </h2>
                    </div>

                    <div className='grid gap-8 lg:grid-cols-2'>
                        <div className='space-y-8'>
                            <Step
                                number='01'
                                title='Configure'
                                description='Tell QueryFish where your spec is, where to put the output, and which file exports your HTTP client.'
                            />
                            <Step
                                number='02'
                                title='Generate'
                                description='Run npx queryfish generate. You get plain TypeScript files that you can read and commit.'
                            />
                            <Step
                                number='03'
                                title='Use'
                                description='Import the hooks in your components. Variables and responses are typed from the spec, and the query keys are already set.'
                            />
                        </div>
                        <div className='space-y-6'>
                            <CodeBlock
                                code={configCode}
                                title='queryfish.config.ts'
                            />
                            <CodeBlock
                                code={generatedOutput}
                                title='Generated output'
                                language='text'
                                showCopy={false}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className='section-divider mx-auto max-w-3xl' />

            {/* ═══ CTA ═══ */}
            <section className='relative py-24'>
                <div className='hero-mesh' />
                <div className='relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8'>
                    <h2 className='mb-6 text-3xl font-bold text-text-primary sm:text-4xl'>
                        Try it on <span className='gradient-text'>your own spec</span>
                    </h2>
                    <p className='mb-10 text-lg text-text-secondary'>
                        Setup takes a few minutes. QueryFish is open source and MIT licensed.
                    </p>
                    <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
                        <Link
                            to='/docs'
                            className='btn-primary'>
                            Read the docs
                            <span>→</span>
                        </Link>
                        <Link
                            to='/examples'
                            className='btn-secondary'>
                            See the example
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className='flex gap-5'>
            <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-brand-blue/20 bg-brand-blue/5 font-mono text-sm font-bold text-brand-sky'>
                {number}
            </div>
            <div>
                <h3 className='mb-1 text-lg font-semibold text-text-primary'>{title}</h3>
                <p className='text-sm leading-relaxed text-text-secondary'>{description}</p>
            </div>
        </div>
    )
}
