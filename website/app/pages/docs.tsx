import { useState } from 'react'
import { CodeBlock } from '../components/code-block'

const sections = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'query-keys', label: 'Query Keys' },
    { id: 'pagination', label: 'Pagination' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'cli', label: 'CLI Reference' },
    { id: 'generated-files', label: 'Generated Files' },
    { id: 'edge-cases', label: 'Edge Cases' },
]

const installCode = `npm install --save-dev queryfish
npm install @tanstack/react-query react-query-kit`

const clientAxiosCode = `// src/api/client.ts
import axios from 'axios'

// The generated request functions import this.
// Add auth headers and interceptors here as usual.
export const client = axios.create({
  baseURL: '/api',
})`

const clientFetchCode = `// src/api/client.ts
interface RequestConfig {
  method: string
  url: string
  params?: Record<string, unknown>
  headers?: Record<string, unknown>
  data?: unknown
}

export const client = {
  async request<T>(config: RequestConfig): Promise<T> {
    const url = new URL(config.url, 'https://api.example.com')

    for (const [key, value] of Object.entries(config.params ?? {})) {
      // skip optional params that weren't passed
      if (value != null) url.searchParams.set(key, String(value))
    }

    const res = await fetch(url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers as Record<string, string>),
      },
      body: config.data ? JSON.stringify(config.data) : undefined,
    })

    if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
    if (res.status === 204) return undefined as T
    return res.json()
  },
}`

const configCode = `// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
  // Path or URL to your OpenAPI or Swagger file. Required.
  input: './openapi.yaml',

  // Folder for the generated files. Required.
  output: './src/api',

  // The file that exports your HTTP client.
  // The generated requests.ts imports it.
  client: './src/api/client.ts',

  // Infinite queries, per endpoint. Leave this out
  // if you don't need pagination.
  pagination: {
    '/pets': {
      param: 'cursor',         // query param that takes the cursor
      nextField: 'nextCursor', // response field with the next cursor
    },
  },

  // Format the output with your Prettier config. Default: true
  format: true,

  // Write an index.ts that re-exports everything. Default: true
  barrel: true,
})`

const generateCode = `npx queryfish generate`

const usageQueryCode = `import { useListPets, useGetPet } from './api/queries'

function PetList() {
  const { data: pets, isPending, error } = useListPets()

  if (isPending) return <Spinner />
  if (error) return <Error message={error.message} />

  return (
    <ul>
      {pets.map(pet => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  )
}

function PetDetail({ petId }: { petId: string }) {
  // petId is required, and it has to be a string
  const { data: pet } = useGetPet({
    variables: { petId },
  })

  return <h1>{pet?.name}</h1>
}`

const usageMutationCode = `import { useCreatePet } from './api/mutations'
import { useQueryClient } from '@tanstack/react-query'

function CreatePetButton() {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useCreatePet({
    onSuccess: () => {
      // invalidates /pets, /pets/{petId} and
      // anything else under /pets
      queryClient.invalidateQueries({
        queryKey: ['pets'],
      })
    },
  })

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({
        body: { name: 'Buddy', tag: 'dog' },
      })}
    >
      {isPending ? 'Saving...' : 'Add pet'}
    </button>
  )
}`

const specExampleCode = `paths:
  /pets/{petId}:
    get:
      operationId: getPet
      summary: Get a pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'`

const queryKeyCode = `// after creating, updating or deleting a pet
queryClient.invalidateQueries({
  queryKey: ['pets'],
})

// that covers every query under /pets:
//   /pets               useListPets
//   /pets/{petId}       useGetPet
//   /pets/{petId}/toys  useListPetToys`

const paginationSpecCode = `# on the GET operation that paginates
x-queryfish-pagination:
  param: cursor          # query param that takes the cursor
  nextField: nextCursor  # response field with the next cursor`

const paginationConfigCode = `// queryfish.config.ts
pagination: {
  '/pets': {
    param: 'cursor',
    nextField: 'nextCursor',
  },
}

// false turns off an opt-in that came from the spec
pagination: {
  '/feed': false,
}`

const paginationUsageCode = `import { useListPetsInfinite } from './api/infiniteQueries'

function PetFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPetsInfinite()

  // cursor isn't in the variables type.
  // The hook passes it from pageParam.
}`

export function DocsPage() {
    const [activeSection, setActiveSection] = useState('quick-start')

    const handleSectionClick = (id: string) => {
        setActiveSection(id)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className='min-h-screen pt-24 pb-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='lg:grid lg:grid-cols-[240px_1fr] lg:gap-10'>
                    {/* Sidebar */}
                    <aside className='hidden lg:block'>
                        <div className='sticky top-24'>
                            <h3 className='mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted'>
                                On this page
                            </h3>
                            <nav className='space-y-1'>
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSectionClick(s.id)}
                                        className={`docs-sidebar-link w-full text-left ${activeSection === s.id ? 'active' : ''}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className='prose-ocean min-w-0'>
                        <h1 className='mb-2 text-4xl font-extrabold text-text-primary'>Documentation</h1>
                        <p className='mb-12 text-lg text-text-secondary'>
                            How to set up QueryFish, and what it generates.
                        </p>

                        {/* ─── Quick Start ─── */}
                        <section id='quick-start'>
                            <h2>Quick Start</h2>
                            <p>
                                QueryFish reads your OpenAPI document and writes TypeScript files with React Query hooks
                                in them. It runs at build time, so it only needs to be a dev dependency.
                            </p>

                            <h3>1. Install</h3>
                            <p>
                                The generated hooks import <code>@tanstack/react-query</code> and{' '}
                                <code>react-query-kit</code>, so install those too if your app doesn&apos;t have them
                                yet.
                            </p>
                            <CodeBlock
                                code={installCode}
                                language='bash'
                                title='Terminal'
                            />

                            <h3>2. Write a client</h3>
                            <p>
                                QueryFish doesn&apos;t come with an HTTP client. The generated code imports a{' '}
                                <code>client</code> from a file you write, which can wrap whatever you already use
                                (axios, fetch, ky). Auth, interceptors, base URLs and error handling all stay in that
                                file.
                            </p>
                            <p>Two versions, depending on what you use:</p>

                            <h3>With axios</h3>
                            <CodeBlock
                                code={clientAxiosCode}
                                title='src/api/client.ts (axios)'
                            />

                            <h3>With fetch</h3>
                            <CodeBlock
                                code={clientFetchCode}
                                title='src/api/client.ts (fetch)'
                            />

                            <div className='callout-tip'>
                                <p>
                                    <strong>Note:</strong> any object works, as long as it&apos;s exported as{' '}
                                    <code>client</code> and has a <code>request&lt;T&gt;(config)</code> method. The
                                    config has <code>method</code>, <code>url</code>, <code>params</code> (query
                                    string), <code>headers</code> and <code>data</code> (body).
                                </p>
                            </div>

                            <h3>3. Add a config file</h3>
                            <p>
                                Create <code>queryfish.config.ts</code> in your project root. <code>input</code> and{' '}
                                <code>output</code> are required. <code>client</code> defaults to <code>./client</code>,
                                so you&apos;ll usually want to set it.
                            </p>
                            <CodeBlock
                                code={configCode}
                                title='queryfish.config.ts'
                            />
                            <p>
                                The config can also be a <code>.mts</code>, <code>.js</code>, <code>.mjs</code> or{' '}
                                <code>.json</code> file.
                            </p>

                            <h3>4. Run the generator</h3>
                            <CodeBlock
                                code={generateCode}
                                language='bash'
                                title='Terminal'
                            />
                            <p>
                                It prints the files it created or changed. The output is run through Prettier with your
                                project&apos;s config.
                            </p>

                            <h3>5. Use the hooks</h3>
                            <p>
                                Import them in your components like any other hook. Variables and response data are
                                typed from the spec.
                            </p>
                            <CodeBlock
                                code={usageQueryCode}
                                title='Queries'
                            />

                            <h3>6. Use the mutations</h3>
                            <p>
                                Mutations are built with react-query-kit&apos;s <code>createMutation</code>, so the
                                usual options like <code>onSuccess</code>, <code>onError</code> and{' '}
                                <code>onSettled</code> all work.
                            </p>
                            <CodeBlock
                                code={usageMutationCode}
                                title='Mutations'
                            />
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── How It Works ─── */}
                        <section id='how-it-works'>
                            <h2>How It Works</h2>
                            <p>Generation happens in four steps:</p>
                            <ul>
                                <li>
                                    <strong>Load:</strong> reads the spec from a file or URL (YAML or JSON) and pulls
                                    any external <code>$ref</code>s into a single document.
                                </li>
                                <li>
                                    <strong>Build the IR:</strong> turns the spec into an internal model of operations
                                    and types. This is where the differences between OpenAPI 3.0, 3.1 and Swagger 2.0
                                    get smoothed over.
                                </li>
                                <li>
                                    <strong>Emit:</strong> writes the TypeScript for <code>types.ts</code>,{' '}
                                    <code>requests.ts</code>, <code>queries.ts</code>, <code>mutations.ts</code> and, if
                                    you opted in, <code>infiniteQueries.ts</code>.
                                </li>
                                <li>
                                    <strong>Write:</strong> formats the output with Prettier, compares it with
                                    what&apos;s on disk, and writes whatever changed. Use <code>--no-format</code> to
                                    skip Prettier.
                                </li>
                            </ul>

                            <p>Take this endpoint:</p>
                            <CodeBlock
                                code={specExampleCode}
                                language='yaml'
                                title='openapi.yaml'
                            />
                            <p>
                                From it you get a <code>GetPetVariables</code> type (with <code>petId: string</code>), a{' '}
                                <code>GetPetResponse</code> type (which is <code>Pet</code>), a <code>getPet</code>{' '}
                                request function, and a <code>useGetPet</code> hook.
                            </p>
                            <p>
                                The operation&apos;s <code>summary</code> is added as a JSDoc comment, so it shows up
                                when you hover the hook in your editor.
                            </p>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Query Keys ─── */}
                        <section id='query-keys'>
                            <h2>Query Keys</h2>
                            <p>
                                Query keys are built from the URL path. <code>GET /pets/&#123;petId&#125;</code> gets
                                the key <code>[&apos;pets&apos;, &apos;&#123;petId&#125;&apos;]</code>, where a lot of
                                generators would use the operation name (<code>[&apos;getPet&apos;]</code>).
                            </p>
                            <p>
                                React Query matches keys by prefix, so invalidating <code>[&apos;pets&apos;]</code> hits
                                every query whose key starts with <code>&apos;pets&apos;</code>. With keys built from
                                the path, that means every query for an endpoint under <code>/pets</code>:
                            </p>
                            <CodeBlock
                                code={queryKeyCode}
                                title='Cache invalidation'
                            />
                            <p>
                                With operation-name keys you&apos;d have to list each of those hooks yourself, and
                                remember to add new ones as the API grows.
                            </p>

                            <div className='callout-tip'>
                                <p>
                                    <strong>Note:</strong> react-query-kit adds the variables to the end of the key, so
                                    pet 123 is cached under{' '}
                                    <code>
                                        [&apos;pets&apos;, &apos;&#123;petId&#125;&apos;, &#123; petId: &apos;123&apos;
                                        &#125;]
                                    </code>
                                    . Each pet still gets its own cache entry.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Pagination ─── */}
                        <section id='pagination'>
                            <h2>Pagination (Infinite Queries)</h2>
                            <p>
                                OpenAPI has no standard way to describe pagination, and APIs all do it a bit
                                differently: cursors, offsets, page numbers. If a generator guesses wrong, you get a
                                hook that compiles but stops after one page, or keeps fetching the same one.
                            </p>
                            <p>
                                So QueryFish doesn&apos;t guess. For each endpoint that paginates, you tell it which
                                query param takes the cursor and which response field holds the next one. You can do
                                that in the spec or in the config.
                            </p>

                            <h3>In the spec</h3>
                            <p>
                                Add <code>x-queryfish-pagination</code> to the operation:
                            </p>
                            <CodeBlock
                                code={paginationSpecCode}
                                language='yaml'
                                title='openapi.yaml'
                            />

                            <h3>In the config</h3>
                            <p>Handy when the spec isn&apos;t yours to edit. If both are set, the config wins:</p>
                            <CodeBlock
                                code={paginationConfigCode}
                                title='queryfish.config.ts'
                            />

                            <h3>Using the hook</h3>
                            <p>
                                You get a <code>useListPetsInfinite</code> hook in <code>infiniteQueries.ts</code>. The
                                cursor isn&apos;t part of its variables, because the hook passes it for you:
                            </p>
                            <CodeBlock
                                code={paginationUsageCode}
                                title='Infinite queries'
                            />

                            <div className='callout-tip'>
                                <p>
                                    <strong>Note:</strong> if nothing opts in, <code>infiniteQueries.ts</code>{' '}
                                    isn&apos;t created.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Configuration ─── */}
                        <section id='configuration'>
                            <h2>Configuration Reference</h2>
                            <p>
                                Options for <code>queryfish.config.ts</code>:
                            </p>

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>Option</th>
                                        <th>Type</th>
                                        <th>Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>input</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <em>required</em>
                                        </td>
                                        <td>Path or URL to the spec. YAML or JSON; OpenAPI 3.0, 3.1 or Swagger 2.0.</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>output</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <em>required</em>
                                        </td>
                                        <td>
                                            Folder to write the generated files to. Created if it doesn&apos;t exist.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>client</code>
                                        </td>
                                        <td>string</td>
                                        <td>
                                            <code>&apos;./client&apos;</code>
                                        </td>
                                        <td>
                                            File that exports your HTTP client. Relative paths are resolved from the
                                            config file&apos;s folder. Aliases like <code>@/lib/api</code> are left as
                                            they are.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>pagination</code>
                                        </td>
                                        <td>object</td>
                                        <td>
                                            <code>undefined</code>
                                        </td>
                                        <td>
                                            Infinite query settings, keyed by path. Set a path to <code>false</code> to
                                            turn off an opt-in that comes from the spec.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>format</code>
                                        </td>
                                        <td>boolean</td>
                                        <td>
                                            <code>true</code>
                                        </td>
                                        <td>
                                            Format the output with Prettier, using your project&apos;s config. The{' '}
                                            <code>--no-format</code> flag does the same as setting it to{' '}
                                            <code>false</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>barrel</code>
                                        </td>
                                        <td>boolean</td>
                                        <td>
                                            <code>true</code>
                                        </td>
                                        <td>
                                            Write an <code>index.ts</code> that re-exports the other files, so you can{' '}
                                            <code>import &#123; ... &#125; from &apos;./api&apos;</code>.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── CLI ─── */}
                        <section id='cli'>
                            <h2>CLI Reference</h2>
                            <p>Flags override the matching options in the config file.</p>
                            <CodeBlock
                                code='npx queryfish generate [options]'
                                language='bash'
                                title='Terminal'
                            />

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>Flag</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>-c, --config &lt;path&gt;</code>
                                        </td>
                                        <td>
                                            Config file to use. Without it, QueryFish looks for{' '}
                                            <code>queryfish.config.*</code> in the current directory.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>-i, --input &lt;spec&gt;</code>
                                        </td>
                                        <td>
                                            Path or URL to the spec. Overrides <code>input</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>-o, --output &lt;dir&gt;</code>
                                        </td>
                                        <td>
                                            Output folder. Overrides <code>output</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--client &lt;module&gt;</code>
                                        </td>
                                        <td>
                                            File that exports your HTTP client. Overrides <code>client</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--dry-run</code>
                                        </td>
                                        <td>
                                            List the files that would be created or changed, without writing anything.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--watch</code>
                                        </td>
                                        <td>
                                            Regenerate when the spec or config file changes. Doesn&apos;t apply when the
                                            input is a URL.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--no-format</code>
                                        </td>
                                        <td>Skip Prettier formatting.</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>--silent</code>
                                        </td>
                                        <td>Only print errors.</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h3>Error messages</h3>
                            <p>If something in the spec is broken, the error says where:</p>
                            <CodeBlock
                                code={`error: cannot resolve schema
  at paths./pets.get.responses.200
  in openapi.yaml:42

  Check that the $ref target exists
  in components.schemas.`}
                                language='text'
                                title='Error output'
                                showCopy={false}
                            />
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Generated Files ─── */}
                        <section id='generated-files'>
                            <h2>What Gets Generated</h2>
                            <p>QueryFish writes up to six files:</p>
                            <CodeBlock
                                code={`src/api/
├── types.ts           # interfaces and type aliases
├── requests.ts        # plain async functions (no React)
├── queries.ts         # createQuery hooks (GET, HEAD)
├── mutations.ts       # createMutation hooks (POST, PUT, PATCH, DELETE)
├── infiniteQueries.ts # createInfiniteQuery hooks (only if you opt in)
└── index.ts           # re-exports everything`}
                                language='text'
                                title='Output structure'
                                showCopy={false}
                            />

                            <table className='docs-table mt-6'>
                                <thead>
                                    <tr>
                                        <th>File</th>
                                        <th>What&apos;s in it</th>
                                        <th>When you&apos;d import it</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <code>types.ts</code>
                                        </td>
                                        <td>
                                            Interfaces from your schemas, plus Variables and Response types for each
                                            operation
                                        </td>
                                        <td>To type a prop or a function parameter</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>requests.ts</code>
                                        </td>
                                        <td>Plain async functions that call your client. No React involved.</td>
                                        <td>In server code, scripts or tests</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>queries.ts</code>
                                        </td>
                                        <td>
                                            <code>useX</code> hooks made with react-query-kit&apos;s{' '}
                                            <code>createQuery</code>
                                        </td>
                                        <td>In components, for GET requests</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>mutations.ts</code>
                                        </td>
                                        <td>
                                            <code>useX</code> hooks made with <code>createMutation</code>
                                        </td>
                                        <td>In components, for POST, PUT, PATCH and DELETE</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>infiniteQueries.ts</code>
                                        </td>
                                        <td>
                                            <code>useXInfinite</code> hooks for paginated endpoints
                                        </td>
                                        <td>Only exists if you opt in to pagination</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <code>index.ts</code>
                                        </td>
                                        <td>Re-exports the other files</td>
                                        <td>
                                            If you&apos;d rather import everything from <code>./api</code>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className='callout-tip'>
                                <p>
                                    <strong>Tip:</strong> commit the generated files. When the spec changes, the PR diff
                                    shows exactly which types and hooks changed.
                                </p>
                            </div>
                        </section>

                        <div className='section-divider my-12' />

                        {/* ─── Edge Cases ─── */}
                        <section id='edge-cases'>
                            <h2>Specs It Handles</h2>
                            <p>
                                Real-world specs tend to be messy. These are the cases QueryFish handles, and each one
                                has a test so it stays fixed:
                            </p>
                            <table className='docs-table mt-4'>
                                <thead>
                                    <tr>
                                        <th>Case</th>
                                        <th>What happens</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong>Recursive schemas</strong>
                                        </td>
                                        <td>
                                            The type is referenced by name instead of inlined, so{' '}
                                            <code>Comment.replies</code> becomes <code>Comment[]</code>. Mutually
                                            recursive types work too.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>
                                                Missing <code>operationId</code>
                                            </strong>
                                        </td>
                                        <td>
                                            A name is built from the method and path:{' '}
                                            <code>GET /pets/&#123;petId&#125;/toys</code> becomes{' '}
                                            <code>getPetsByPetIdToys</code>.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>
                                                Duplicate <code>operationId</code>
                                            </strong>
                                        </td>
                                        <td>
                                            Later ones get a number on the end (<code>duplicated</code>,{' '}
                                            <code>duplicated2</code>) and you get a warning so you can fix the spec.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Reserved words</strong>
                                        </td>
                                        <td>
                                            An operation called <code>delete</code> becomes <code>delete_</code>, since{' '}
                                            <code>delete</code> is a JavaScript keyword.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Odd parameter names</strong>
                                        </td>
                                        <td>
                                            Names like <code>filter[status]</code> and <code>X-Request-Id</code> are
                                            quoted in the generated types.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Schema composition</strong>
                                        </td>
                                        <td>
                                            <code>allOf</code> becomes an intersection (<code>&amp;</code>),{' '}
                                            <code>oneOf</code> and <code>anyOf</code> become a union (<code>|</code>).
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Nullability</strong>
                                        </td>
                                        <td>
                                            Both OpenAPI 3.0&apos;s <code>nullable: true</code> and 3.1&apos;s{' '}
                                            <code>type: [&apos;string&apos;, &apos;null&apos;]</code> work.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Empty responses</strong>
                                        </td>
                                        <td>
                                            A <code>204 No Content</code> response is typed as <code>void</code>, not an
                                            empty object.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Swagger 2.0</strong>
                                        </td>
                                        <td>
                                            The older <code>definitions</code> key, <code>in: body</code> parameters and
                                            response schemas all work.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    )
}
