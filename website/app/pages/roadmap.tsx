import { Link } from 'react-router'

const completed = [
    {
        title: 'Query and mutation hooks',
        description: 'createQuery hooks for GET and HEAD, createMutation hooks for POST, PUT, PATCH and DELETE.',
    },
    {
        title: 'Infinite queries (opt-in)',
        description: 'createInfiniteQuery hooks for the endpoints you mark as paginated, in the config or in the spec.',
    },
    {
        title: 'Bring your own HTTP client',
        description: 'Generated requests call a client you export, so axios, fetch, ky or your own wrapper all work.',
    },
    {
        title: 'Watch mode',
        description: 'Regenerates when the spec or config file changes.',
    },
    {
        title: 'OpenAPI 3.0, 3.1 and Swagger 2.0',
        description: 'Specs are loaded with Redocly, which reads all three versions.',
    },
]

const upcoming = [
    {
        title: 'Zod schemas',
        description: 'Generate Zod schemas next to the TypeScript types, so responses can be validated at runtime.',
        tag: 'Up Next',
    },
    {
        title: 'MSW handlers',
        description: 'Generate Mock Service Worker handlers from the spec, for tests and local development.',
        tag: 'Planned',
    },
    {
        title: 'Suspense hooks',
        description: 'createSuspenseQuery variants for apps that use Suspense for loading states.',
        tag: 'Planned',
    },
    {
        title: 'Plugins',
        description: 'A way to add your own output files without forking the generator.',
        tag: 'Exploring',
    },
]

export function RoadmapPage() {
    return (
        <div className='min-h-screen pt-24 pb-16'>
            <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
                <div className='mb-16'>
                    <h1 className='mb-4 text-4xl font-extrabold text-text-primary'>Roadmap</h1>
                    <p className='max-w-2xl text-lg text-text-secondary'>
                        What&apos;s in 1.0 and what&apos;s planned next. If you need something that isn&apos;t listed
                        here,{' '}
                        <a
                            href='https://github.com/ravitejas-tech/queryfish/issues'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-accent-400 no-underline hover:underline'>
                            open an issue
                        </a>
                        .
                    </p>
                </div>

                {/* Completed */}
                <div className='mb-16'>
                    <div className='mb-6 flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10'>
                            <span className='text-emerald-400'>✓</span>
                        </div>
                        <h2 className='text-2xl font-bold text-text-primary'>Shipped</h2>
                        <span className='rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400'>
                            v1.0
                        </span>
                    </div>

                    <div className='space-y-1'>
                        {completed.map((item) => (
                            <div
                                key={item.title}
                                className='roadmap-item pb-4'>
                                <div className='roadmap-dot roadmap-dot-done'>
                                    <svg
                                        width='12'
                                        height='12'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='white'
                                        strokeWidth='3'>
                                        <path d='M20 6L9 17l-5-5' />
                                    </svg>
                                </div>
                                <h3 className='mb-1 font-semibold text-text-primary'>{item.title}</h3>
                                <p className='text-sm text-text-secondary'>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='section-divider mb-16' />

                {/* Upcoming */}
                <div>
                    <div className='mb-6 flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10'>
                            <span className='text-accent-400'>◇</span>
                        </div>
                        <h2 className='text-2xl font-bold text-text-primary'>Next</h2>
                    </div>

                    <div className='space-y-1'>
                        {upcoming.map((item) => (
                            <div
                                key={item.title}
                                className='roadmap-item pb-4'>
                                <div className='roadmap-dot roadmap-dot-pending' />
                                <div className='flex items-start justify-between gap-4'>
                                    <div>
                                        <h3 className='mb-1 font-semibold text-text-primary'>{item.title}</h3>
                                        <p className='text-sm text-text-secondary'>{item.description}</p>
                                    </div>
                                    <span
                                        className={`mt-1 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            item.tag === 'Up Next'
                                                ? 'bg-accent-500/10 text-accent-400'
                                                : item.tag === 'Planned'
                                                  ? 'bg-glow-500/10 text-glow-400'
                                                  : 'bg-ocean-700/50 text-text-muted'
                                        }`}>
                                        {item.tag}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className='mt-20 text-center'>
                    <div className='glass-card inline-block px-8 py-6'>
                        <p className='mb-4 text-text-secondary'>Have an idea, or a spec that doesn&apos;t work?</p>
                        <div className='flex flex-col items-center gap-3 sm:flex-row'>
                            <a
                                href='https://github.com/ravitejas-tech/queryfish/issues'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='btn-primary'>
                                Open an issue
                                <span>→</span>
                            </a>
                            <Link
                                to='/docs'
                                className='btn-secondary'>
                                Read the docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
