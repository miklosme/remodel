import Link from 'next/link'

import { IconLink } from '@/components/IconLink'
import { Logo } from '@/components/Logo'
import { SignUpForm } from '@/components/SignUpForm'

// function BookIcon(props) {
//   return (
//     <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
//       <path d="M7 3.41a1 1 0 0 0-.668-.943L2.275 1.039a.987.987 0 0 0-.877.166c-.25.192-.398.493-.398.812V12.2c0 .454.296.853.725.977l3.948 1.365A1 1 0 0 0 7 13.596V3.41ZM9 13.596a1 1 0 0 0 1.327.946l3.948-1.365c.429-.124.725-.523.725-.977V2.017c0-.32-.147-.62-.398-.812a.987.987 0 0 0-.877-.166L9.668 2.467A1 1 0 0 0 9 3.41v10.186Z" />
//     </svg>
//   )
// }

// function GitHubIcon(props) {
//   return (
//     <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
//       <path d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z" />
//     </svg>
//   )
// }

// function FeedIcon(props) {
//   return (
//     <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
//       <path
//         fillRule="evenodd"
//         clipRule="evenodd"
//         d="M2.5 3a.5.5 0 0 1 .5-.5h.5c5.523 0 10 4.477 10 10v.5a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5v-.5A8.5 8.5 0 0 0 3.5 4H3a.5.5 0 0 1-.5-.5V3Zm0 4.5A.5.5 0 0 1 3 7h.5A5.5 5.5 0 0 1 9 12.5v.5a.5.5 0 0 1-.5.5H8a.5.5 0 0 1-.5-.5v-.5a4 4 0 0 0-4-4H3a.5.5 0 0 1-.5-.5v-.5Zm0 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
//       />
//     </svg>
//   )
// }

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M5.526 13.502c5.032 0 7.784-4.168 7.784-7.783 0-.119 0-.237-.008-.353a5.566 5.566 0 0 0 1.364-1.418 5.46 5.46 0 0 1-1.571.431c.571-.342.998-.88 1.203-1.513a5.483 5.483 0 0 1-1.737.664 2.738 2.738 0 0 0-4.662 2.495 7.767 7.767 0 0 1-5.638-2.858 2.737 2.737 0 0 0 .847 3.651 2.715 2.715 0 0 1-1.242-.341v.035a2.737 2.737 0 0 0 2.195 2.681 2.73 2.73 0 0 1-1.235.047 2.739 2.739 0 0 0 2.556 1.9 5.49 5.49 0 0 1-4.049 1.133A7.744 7.744 0 0 0 5.526 13.5" />
    </svg>
  )
}

export function Intro() {
  return (
    <>
      {/* <div>
        <Link href="/">
          <div className="shadermagic-container">
            <Logo className="shadermagic-under inline-block h-20 w-auto" />
            <Logo className="shadermagic-over inline-block h-20 w-auto" />
          </div>
          <span className="ml-3 align-middle text-4xl font-semibold tracking-tight text-white">
            Magick
          </span>
        </Link>
      </div> */}
      <div className="text-white">
        <Link href="/">
          <Logo className="-ml-[10px] inline-block h-20 w-auto" />
          <span className="ml-3 align-middle text-4xl font-semibold tracking-tight">
            Remodel
          </span>
        </Link>
      </div>
      <h1 className="mt-14 font-display text-4xl/tight font-light text-white">
        Revitalize your old codebase with{' '}
        <span className="whitespace-nowrap text-sky-300">
          AI-Powered Refactoring
        </span>
      </h1>
      <p className="mt-4 text-sm/6 text-gray-300">
        Remodel is an AI-driven developer tool designed to help software
        engineers migrate their old web applications to a new tech stack while
        preserving{' '}
        <span className="whitespace-nowrap">all original functionality.</span>
      </p>
      <p className="mt-4 text-sm/6 text-gray-300">
        With support for JavaScript/TypeScript and React as the output, Remodel
        can refactor web apps from any language and framework.
      </p>
      <SignUpForm />
      {/* <div className="mt-8 flex flex-wrap justify-center gap-x-1 gap-y-3 sm:gap-x-2 lg:justify-start">
        <IconLink
          href="https://docs.remodel.sh"
          target="_blank"
          icon={BookIcon}
          className="flex-none"
        >
          Documentation
        </IconLink>
        <IconLink href="#" icon={GitHubIcon} className="flex-none">
          GitHub
        </IconLink>
        <IconLink href="/rss/feed.xml" icon={FeedIcon} className="flex-none">
          RSS
        </IconLink>
      </div> */}
    </>
  )
}

export function IntroFooter() {
  return (
    <p className="flex items-baseline gap-x-2 text-[0.8125rem]/6 text-gray-500">
      Brought to you by{' '}
      <IconLink
        href="https://twitter.com/miklosme"
        target="_blank"
        icon={TwitterIcon}
        compact
        large
      >
        @miklosme
      </IconLink>
    </p>
  )
}
